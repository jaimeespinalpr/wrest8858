const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const repoRoot = path.resolve(__dirname, '..', '..');
const port = Number(process.env.WPL_TEST_PORT || 4174);
const baseUrl = `http://127.0.0.1:${port}`;
const routeExpectations = [
  { route: '/', panels: [] },
  { route: '/home/', panels: ['panel-dashboard'] },
  { route: '/plans/', panels: ['panel-plans', 'panel-assignments'] },
  { route: '/messages/', panels: ['panel-messages'], expectMessagesDomain: true },
  { route: '/training/', panels: ['panel-training'] },
  { route: '/media/', panels: ['panel-media'] }
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
    res.writeHead(200, {
      'Content-Type': contentTypes.get(ext) || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function inspectRoute(browser, expectation) {
  const page = await browser.newPage();
  const sameOriginFailures = [];
  const pageErrors = [];
  const consoleErrors = [];
  const scriptUrls = [];

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.startsWith(baseUrl)) {
      sameOriginFailures.push(`${request.method()} ${url} ${request.failure()?.errorText || ''}`.trim());
    }
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('response', async (response) => {
    const request = response.request();
    if (request.resourceType() === 'script' && response.url().startsWith(baseUrl)) {
      scriptUrls.push(response.url().replace(baseUrl, ''));
    }
  });

  await page.goto(`${baseUrl}${expectation.route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);

  const loginControls = await page.evaluate(() => ({
    loginEmailVisible: Boolean(document.querySelector('#loginEmail')?.checkVisibility?.()),
    loginPasswordVisible: Boolean(document.querySelector('#loginPassword')?.checkVisibility?.()),
    createAccountVisible: Boolean(document.querySelector('#createAccountBtn')?.checkVisibility?.()),
    guestCoachVisible: Boolean(document.querySelector('#guestCoachBtn')?.checkVisibility?.())
  }));

  let registerControls = null;
  if (expectation.route === '/') {
    await page.locator('#createAccountBtn').click();
    await page.waitForTimeout(200);
    registerControls = await page.evaluate(() => ({
      modalVisible: Boolean(document.querySelector('#registerModal:not(.hidden)')),
      nameVisible: Boolean(document.querySelector('#pName')?.checkVisibility?.()),
      emailVisible: Boolean(document.querySelector('#pEmail')?.checkVisibility?.()),
      passwordVisible: Boolean(document.querySelector('#pPassword')?.checkVisibility?.()),
      roleVisible: Boolean(document.querySelector('#pRole')?.checkVisibility?.())
    }));
    await page.locator('#registerCloseBtn').click();
    await page.waitForTimeout(200);
  }

  const panelChecks = await page.evaluate((panelIds) => Object.fromEntries(panelIds.map((id) => {
    const el = document.getElementById(id);
    return [id, { exists: Boolean(el), hidden: Boolean(el?.classList.contains('hidden')) }];
  })), expectation.panels);
  const appRootHidden = await page.locator('#appRoot.hidden').count().catch(() => 0);
  const activePanels = await page.locator('.panel:not(.hidden)').evaluateAll((els) => els.map((el) => el.id)).catch(() => []);
  const messagesDomainLoaded = await page.evaluate(() => Boolean(window.WPLMessagesDomain));
  const messagesScriptRequested = scriptUrls.some((url) => url.includes('/messages-domain.js'));

  await page.close();
  return {
    route: expectation.route,
    loginControls,
    registerControls,
    panelChecks,
    activePanels,
    appRootHidden: Boolean(appRootHidden),
    messagesDomainLoaded,
    messagesScriptRequested,
    sameOriginFailures,
    pageErrors,
    consoleErrors,
    scriptUrls
  };
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const results = [];
    for (const expectation of routeExpectations) {
      results.push(await inspectRoute(browser, expectation));
    }
    const failures = [];
    for (const result of results) {
      const expectation = routeExpectations.find((item) => item.route === result.route);
      if (result.sameOriginFailures.length) failures.push(`${result.route}: same-origin request failures`);
      if (result.pageErrors.length) failures.push(`${result.route}: page errors`);
      for (const [panelId, check] of Object.entries(result.panelChecks)) {
        if (!check.exists) failures.push(`${result.route}: missing #${panelId}`);
      }
      if (expectation.expectMessagesDomain && (!result.messagesScriptRequested || !result.messagesDomainLoaded)) {
        failures.push(`${result.route}: messages-domain.js was not loaded`);
      }
      if (!expectation.expectMessagesDomain && result.messagesScriptRequested) {
        failures.push(`${result.route}: messages-domain.js loaded unexpectedly`);
      }
    }
    const root = results.find((item) => item.route === '/');
    if (!root?.loginControls.loginEmailVisible || !root?.loginControls.loginPasswordVisible || !root?.loginControls.createAccountVisible) {
      failures.push('/: login controls are not visible');
    }
    if (!root?.registerControls?.modalVisible || !root?.registerControls?.nameVisible || !root?.registerControls?.emailVisible || !root?.registerControls?.passwordVisible || !root?.registerControls?.roleVisible) {
      failures.push('/: register controls are not visible after opening create-account modal');
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      note: 'Authenticated Firebase workflows were not exercised because no test credentials/secrets are available in this environment; this smoke verifies unauthenticated login/register controls, route loading, expected panel DOM, and guarded messages lazy loading.',
      results,
      failures
    };
    console.log(JSON.stringify(payload, null, 2));
    if (failures.length) process.exit(1);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
