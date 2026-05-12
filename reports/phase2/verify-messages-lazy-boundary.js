const { chromium } = require('playwright');

const baseUrl = process.env.WPL_TEST_BASE_URL || 'http://127.0.0.1:4173';
const routes = ['/', '/messages/', '/plans/', '/training/', '/home/', '/media/'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const route of routes) {
    const page = await browser.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const sameOriginFailures = [];
    const scriptUrls = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('requestfailed', (request) => {
      const url = request.url();
      if (url.startsWith(baseUrl)) {
        sameOriginFailures.push(`${request.method()} ${url} ${request.failure()?.errorText || ''}`.trim());
      }
    });
    page.on('response', async (response) => {
      const request = response.request();
      if (request.resourceType() === 'script' && response.url().startsWith(baseUrl)) {
        scriptUrls.push(response.url().replace(baseUrl, ''));
      }
    });
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const loginEmailVisible = await page.locator('#loginEmail').isVisible().catch(() => false);
    const registerNameVisible = await page.locator('#registerName').isVisible().catch(() => false);
    const activePanels = await page.locator('.panel:not(.hidden)').count().catch(() => -1);
    const messagesDomainLoaded = await page.evaluate(() => Boolean(window.WPLMessagesDomain));
    const messagePanelVisible = await page.locator('#panel-messages:not(.hidden)').count().catch(() => 0);
    const messagesScriptRequested = scriptUrls.some((url) => url.includes('/messages-domain.js'));
    results.push({
      route,
      activePanels,
      loginEmailVisible,
      registerNameVisible,
      messagePanelVisible: Boolean(messagePanelVisible),
      messagesDomainLoaded,
      messagesScriptRequested,
      sameOriginFailures,
      consoleErrors,
      pageErrors,
      scriptUrls
    });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
  const failed = results.filter((result) => result.sameOriginFailures.length || result.pageErrors.length);
  const unexpectedMessagesLoads = results.filter((result) => result.route !== '/messages/' && result.messagesScriptRequested);
  const messagesRoute = results.find((result) => result.route === '/messages/');
  if (failed.length) {
    console.error('Route verification failures detected.');
    process.exit(1);
  }
  if (!messagesRoute?.messagesScriptRequested || !messagesRoute?.messagesDomainLoaded) {
    console.error('Messages route did not load messages-domain.js.');
    process.exit(1);
  }
  if (unexpectedMessagesLoads.length) {
    console.error('messages-domain.js loaded on non-messages routes:', unexpectedMessagesLoads.map((r) => r.route).join(', '));
    process.exit(1);
  }
})();
