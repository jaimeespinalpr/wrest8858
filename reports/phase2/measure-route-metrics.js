const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

const repoRoot = path.resolve(__dirname, '..', '..');
const reportsDir = __dirname;
const port = Number(process.env.WPL_METRICS_PORT || 42251);
const baseUrl = `http://127.0.0.1:${port}`;
const routes = [
  '/',
  '/today/',
  '/home/',
  '/plans/',
  '/messages/',
  '/training/',
  '/media/',
  '/athletes/',
  '/calendar/',
  '/profile/',
  '/journal/',
  '/favorites/',
  '/announcements/',
  '/competition/',
  '/tournament/',
  '/parent/',
  '/scouting/',
  '/coach-profile/',
  '/permissions/'
];

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.ico', 'image/x-icon'],
  ['.svg', 'image/svg+xml']
]);

function gitValue(command, fallback) {
  try {
    return execSync(command, { cwd: repoRoot, encoding: 'utf8' }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function safeJoin(root, requestPath) {
  const cleanUrl = new URL(requestPath, baseUrl);
  let pathname = decodeURIComponent(cleanUrl.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  let filePath = path.resolve(root, `.${pathname}`);
  if (!filePath.startsWith(root)) return null;
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    filePath = path.join(filePath, 'index.html');
  }
  return filePath;
}

function startServer() {
  const server = http.createServer((req, res) => {
    const requested = safeJoin(repoRoot, req.url || '/');
    const fallback = path.join(repoRoot, 'index.html');
    const filePath = requested && fs.existsSync(requested) && fs.statSync(requested).isFile()
      ? requested
      : fallback;
    const ext = path.extname(filePath).toLowerCase();
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentTypes.get(ext) || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function responseSize(response) {
  const lengthHeader = response.headers()['content-length'];
  if (lengthHeader && /^\d+$/.test(lengthHeader)) return Number(lengthHeader);
  try {
    return (await response.body()).length;
  } catch {
    return 0;
  }
}

async function inspectRoute(browser, route) {
  const page = await browser.newPage();
  const failedRequests = [];
  const pageErrors = [];
  const responses = [];

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.startsWith(baseUrl)) {
      failedRequests.push(`${request.method()} ${url} ${request.failure()?.errorText || ''}`.trim());
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    responses.push((async () => {
      const request = response.request();
      const url = response.url();
      const size = await responseSize(response);
      return {
        url,
        resourceType: request.resourceType(),
        sameOrigin: url.startsWith(baseUrl),
        size
      };
    })());
  });

  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const collectedResponses = await Promise.all(responses);

  const dom = await page.evaluate(() => ({
    title: document.title,
    domElements: document.querySelectorAll('*').length,
    scriptTagsInDom: document.querySelectorAll('script').length,
    stylesheetsInDom: document.querySelectorAll('link[rel="stylesheet"]').length,
    panelCount: document.querySelectorAll('.panel').length,
    pruned: Boolean(window.WPL_ROUTED_PANEL_PRUNING),
    removedPanelCount: Number(window.WPL_ROUTE_REMOVED_PANEL_COUNT || 0),
    preservedPanels: Array.isArray(window.WPL_ROUTE_PRESERVED_PANELS) ? window.WPL_ROUTE_PRESERVED_PANELS.slice() : [],
    messagesDomainLoaded: Boolean(window.WPLMessagesDomain)
  }));
  await page.close();

  const sameOriginResponses = collectedResponses.filter((item) => item.sameOrigin);
  const scriptResponses = collectedResponses.filter((item) => item.resourceType === 'script');
  const sameOriginScriptResponses = scriptResponses.filter((item) => item.sameOrigin);
  return {
    route,
    url: `${baseUrl}${route}`,
    ...dom,
    requests: collectedResponses.length,
    sameOriginRequests: sameOriginResponses.length,
    sameOriginPayloadBytes: sameOriginResponses.reduce((sum, item) => sum + item.size, 0),
    totalKnownPayloadBytes: collectedResponses.reduce((sum, item) => sum + item.size, 0),
    scriptRequestCount: scriptResponses.length,
    sameOriginScriptRequestCount: sameOriginScriptResponses.length,
    sameOriginScriptBytes: sameOriginScriptResponses.reduce((sum, item) => sum + item.size, 0),
    failedRequests,
    pageErrors
  };
}

function summarizeComparison(current, baseline) {
  const baselineByRoute = new Map((baseline.routes || []).map((route) => [route.route, route]));
  return current.routes.map((route) => {
    const before = baselineByRoute.get(route.route);
    return {
      route: route.route,
      domElementsBefore: before?.domElements ?? null,
      domElementsAfter: route.domElements,
      domElementsDelta: before ? route.domElements - before.domElements : null,
      sameOriginScriptBytesBefore: before?.sameOriginScriptBytes ?? null,
      sameOriginScriptBytesAfter: route.sameOriginScriptBytes,
      sameOriginScriptBytesDelta: before ? route.sameOriginScriptBytes - before.sameOriginScriptBytes : null,
      sameOriginPayloadBytesBefore: before?.sameOriginPayloadBytes ?? null,
      sameOriginPayloadBytesAfter: route.sameOriginPayloadBytes,
      sameOriginPayloadBytesDelta: before ? route.sameOriginPayloadBytes - before.sameOriginPayloadBytes : null,
      messagesDomainLoaded: route.messagesDomainLoaded,
      failedRequestCount: route.failedRequests.length,
      pageErrorCount: route.pageErrors.length
    };
  });
}

function formatBytes(value) {
  if (value === null || value === undefined) return 'n/a';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString()} B`;
}

function writeMarkdown(current, comparison) {
  const failures = current.routes.flatMap((route) => [
    ...route.failedRequests.map((failure) => `${route.route}: ${failure}`),
    ...route.pageErrors.map((error) => `${route.route}: page error: ${error}`)
  ]);
  const lines = [];
  lines.push('# Phase 2 Post-Lazy Route Metrics Comparison');
  lines.push('');
  lines.push(`Measured: ${current.measuredAt}`);
  lines.push(`Branch: ${current.branch}`);
  lines.push(`Commit: ${current.commit}`);
  lines.push('');
  lines.push('Compared against `reports/phase2/baseline-route-metrics.json` from before the guarded Messages lazy split.');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Routes measured: ${current.routes.length}`);
  lines.push(`- Same-origin request failures: ${failures.length}`);
  lines.push(`- messages-domain.js loaded on /messages/: ${current.routes.find((route) => route.route === '/messages/')?.messagesDomainLoaded ? 'yes' : 'no'}`);
  lines.push(`- messages-domain.js loaded on non-message routes: ${current.routes.filter((route) => route.route !== '/messages/' && route.messagesDomainLoaded).length}`);
  lines.push('');
  lines.push('## Route comparison');
  lines.push('');
  lines.push('| Route | DOM Δ | Same-origin script bytes Δ | Same-origin payload bytes Δ | Messages domain loaded | Failures |');
  lines.push('|---|---:|---:|---:|---|---:|');
  for (const row of comparison) {
    lines.push(`| ${row.route} | ${row.domElementsDelta ?? 'n/a'} | ${formatBytes(row.sameOriginScriptBytesDelta)} | ${formatBytes(row.sameOriginPayloadBytesDelta)} | ${row.messagesDomainLoaded ? 'yes' : 'no'} | ${row.failedRequestCount + row.pageErrorCount} |`);
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- Expected result after the split: non-message routes should avoid loading `messages-domain.js`; `/messages/` should load it.');
  lines.push('- This is a local static Playwright measurement only; authenticated Firebase data flows and deploy behavior were not exercised.');
  if (failures.length) {
    lines.push('');
    lines.push('## Failures');
    lines.push('');
    for (const failure of failures) lines.push(`- ${failure}`);
  }
  fs.writeFileSync(path.join(reportsDir, 'post-lazy-route-metrics.md'), `${lines.join('\n')}\n`);
}

(async () => {
  const baselinePath = path.join(reportsDir, 'baseline-route-metrics.json');
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const measuredRoutes = [];
    for (const route of routes) {
      measuredRoutes.push(await inspectRoute(browser, route));
    }
    const current = {
      measuredAt: new Date().toISOString(),
      branch: gitValue('git branch --show-current', 'unknown'),
      commit: gitValue('git rev-parse --short HEAD', 'unknown'),
      note: 'Phase 2 post-lazy measurement after guarded Messages domain split. Payload bytes are same-origin response content-length/body sums; external responses are counted only when size is known.',
      routes: measuredRoutes
    };
    const comparison = summarizeComparison(current, baseline);
    const output = { ...current, comparison };
    fs.writeFileSync(path.join(reportsDir, 'post-lazy-route-metrics.json'), `${JSON.stringify(output, null, 2)}\n`);
    writeMarkdown(current, comparison);
    const failureCount = measuredRoutes.reduce((sum, route) => sum + route.failedRequests.length + route.pageErrors.length, 0);
    console.log(JSON.stringify({ measuredRoutes: measuredRoutes.length, failureCount, output: 'reports/phase2/post-lazy-route-metrics.json' }, null, 2));
    if (failureCount) process.exit(1);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
