const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const URL = process.env.NIGHTCAST_LOGIN_URL || 'https://nightcast.ir/users/login.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.route('https://nightcast-shield.tomasgermany2580.workers.dev/api/v1/captcha/challenge', async route => {
      const headers = {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'Content-Type, Accept'
      };
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers });
        return;
      }
      await route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, id: '1234567890abcdef1234567890abcdef', question: '3 + 4 = ?', action: 'login' })
      });
    });
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
      const widget = document.querySelector('[data-nc-shield="login"]');
      const question = widget && widget.querySelector('[data-nc-shield-question]');
      const answer = widget && widget.querySelector('[data-nc-shield-answer]');
      return widget && widget.dataset.state === 'ready' && question && question.textContent.trim() === '3 + 4 = ?' &&
        answer && !answer.disabled;
    }, { timeout: 10000 });
    const state = await page.evaluate(() => {
      const container = document.querySelector('#googleLoginButton');
      const widget = document.querySelector('[data-nc-shield="login"]');
      const answer = widget && widget.querySelector('[data-nc-shield-answer]');
      const continueButton = widget && widget.querySelector('[data-nc-shield-continue]');
      const visible = element => Boolean(element && element.getClientRects().length &&
        getComputedStyle(element).display !== 'none' &&
        getComputedStyle(element).visibility !== 'hidden');
      return {
        title: document.title,
        heading: document.querySelector('#loginTitle')?.innerText?.trim(),
        cardVisible: Boolean(document.querySelector('.login-card')?.getClientRects().length),
        captchaWidgetPresent: Boolean(widget),
        securityTitleVisible: visible(widget && widget.querySelector('.nc-shield-title')),
        securityQuestion: widget && widget.querySelector('[data-nc-shield-question]')?.textContent?.trim(),
        securityAnswerVisible: visible(answer),
        securityAnswerEnabled: Boolean(answer && !answer.disabled),
        continueButtonVisible: visible(continueButton),
        googleContainerPresent: Boolean(container),
        googleActionHiddenUntilProof: Boolean(container && (container.hidden || getComputedStyle(container).display === 'none')),
        statusRegionPresent: Boolean(document.querySelector('#loginMessage')),
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth
      };
    });
    assert.match(state.title, /NightCast/i, 'Unexpected login document title');
    assert.ok(state.heading, 'Login heading is empty');
    assert.equal(state.cardVisible, true, 'Login card is not visible');
    assert.equal(state.captchaWidgetPresent, true, 'Login CAPTCHA widget is missing');
    assert.equal(state.securityTitleVisible, true, 'Security challenge title is not visible');
    assert.equal(state.securityQuestion, '3 + 4 = ?', 'Security question is not visibly rendered');
    assert.equal(state.securityAnswerVisible, true, 'Security answer input is not visible');
    assert.equal(state.securityAnswerEnabled, true, 'Security answer input is disabled');
    assert.equal(state.continueButtonVisible, true, 'Security continue action is not visible');
    assert.equal(state.googleContainerPresent, true, 'Google login container is missing');
    assert.equal(state.googleActionHiddenUntilProof, true, 'Google action must remain hidden until CAPTCHA is answered');
    assert.equal(state.statusRegionPresent, true, 'Login status region is missing');
    assert.ok(state.documentWidth <= state.viewportWidth + 1,
      'Login page overflows horizontally: ' + JSON.stringify(state));
    assert.deepEqual(pageErrors, [], 'Uncaught browser JavaScript errors: ' + JSON.stringify(pageErrors));
    console.log('LOGIN_PAGE_LOAD_RESULT | ' + JSON.stringify({ httpStatus: response.status(), ...state, pageErrors }));
    console.log('PASS | Login page loads with visible security challenge, Google gated until answer, mobile layout fits, and no uncaught page errors occur');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
