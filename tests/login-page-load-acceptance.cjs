const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const URL = process.env.NIGHTCAST_LOGIN_URL || 'https://nightcast.ir/users/login.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const response = await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    assert.ok(response, 'Login navigation returned no HTTP response');
    assert.ok(response.status() >= 200 && response.status() < 400,
      'Login page returned HTTP ' + response.status());
    await page.locator('.login-card').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('#loginTitle').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('[data-nc-shield="login"]').waitFor({ state: 'attached', timeout: 5000 });
    await page.locator('#googleLoginButton').waitFor({ state: 'attached', timeout: 5000 });
    await page.locator('#loginMessage').waitFor({ state: 'attached', timeout: 5000 });
    await page.waitForFunction(() => {
      const container = document.querySelector('#googleLoginButton');
      const fallback = document.querySelector('#googleLoginFallback');
      const frame = container && container.querySelector('iframe');
      const officialButton = container && container.querySelector('button:not(#googleLoginFallback)');
      const visible = element => Boolean(element && element.getClientRects().length &&
        getComputedStyle(element).display !== 'none' &&
        getComputedStyle(element).visibility !== 'hidden' &&
        Number(getComputedStyle(element).opacity || 1) > 0);
      return visible(container) && container.getAttribute('aria-hidden') !== 'true' &&
        (visible(fallback) || visible(frame) || visible(officialButton));
    }, { timeout: 10000 });
    const state = await page.evaluate(() => {
      const container = document.querySelector('#googleLoginButton');
      const fallback = document.querySelector('#googleLoginFallback');
      const frame = container && container.querySelector('iframe');
      const officialButton = container && container.querySelector('button:not(#googleLoginFallback)');
      const visible = element => Boolean(element && element.getClientRects().length &&
        getComputedStyle(element).display !== 'none' &&
        getComputedStyle(element).visibility !== 'hidden' &&
        Number(getComputedStyle(element).opacity || 1) > 0);
      return {
        title: document.title,
        heading: document.querySelector('#loginTitle')?.innerText?.trim(),
        cardVisible: Boolean(document.querySelector('.login-card')?.getClientRects().length),
        captchaWidgetPresent: Boolean(document.querySelector('[data-nc-shield="login"]')),
        googleContainerPresent: Boolean(container),
        googleActionVisible: visible(container) && container.getAttribute('aria-hidden') !== 'true' &&
          (visible(fallback) || visible(frame) || visible(officialButton)),
        googleFallbackVisible: visible(fallback),
        googleOfficialFrameVisible: visible(frame),
        googleOfficialButtonVisible: visible(officialButton),
        statusRegionPresent: Boolean(document.querySelector('#loginMessage')),
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth
      };
    });
    assert.match(state.title, /NightCast/i, 'Unexpected login document title');
    assert.ok(state.heading, 'Login heading is empty');
    assert.equal(state.cardVisible, true, 'Login card is not visible');
    assert.equal(state.captchaWidgetPresent, true, 'Login CAPTCHA widget is missing');
    assert.equal(state.googleContainerPresent, true, 'Google login container is missing');
    assert.equal(state.googleActionVisible, true,
      'The "Continue with Google" action is hidden or missing: ' + JSON.stringify(state));
    assert.equal(state.statusRegionPresent, true, 'Login status region is missing');
    assert.ok(state.documentWidth <= state.viewportWidth + 1,
      'Login page overflows horizontally: ' + JSON.stringify(state));
    assert.deepEqual(pageErrors, [], 'Uncaught browser JavaScript errors: ' + JSON.stringify(pageErrors));
    console.log('LOGIN_PAGE_LOAD_RESULT | ' + JSON.stringify({ httpStatus: response.status(), ...state, pageErrors }));
    console.log('PASS | Login page loads, Google action is visible, core controls exist, layout fits mobile viewport, and no uncaught page errors occur');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
