const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const LOGIN_URL = process.env.NIGHTCAST_LOGIN_URL || 'https://nightcast.ir/users/login.html';
const STORAGE_KEY = 'nightcast.login.captchaProof.v1';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('NightCastToken');
        localStorage.removeItem('NightCastUser');
        sessionStorage.removeItem('nightcast.login.captchaProof.v1');
      } catch (_) {}
    });

    const response = await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    assert.ok(response && response.status() < 400, 'Login page did not load');
    await page.waitForSelector('[data-nc-shield="login"] [data-nc-shield-question]', { state: 'visible', timeout: 15000 });
    await page.waitForFunction(() => {
      const widget = document.querySelector('[data-nc-shield="login"]');
      const question = widget && widget.querySelector('[data-nc-shield-question]');
      const answer = widget && widget.querySelector('[data-nc-shield-answer]');
      return widget && widget.dataset.state === 'ready' && question &&
        question.textContent.trim() && !/در حال دریافت|در حال آماده‌سازی/.test(question.textContent) &&
        answer && !answer.disabled;
    }, { timeout: 20000 });

    const initial = await page.evaluate(() => {
      const widget = document.querySelector('[data-nc-shield="login"]');
      const google = document.getElementById('googleLoginButton');
      return {
        title: widget.querySelector('.nc-shield-title')?.textContent?.trim() || '',
        question: widget.querySelector('[data-nc-shield-question]')?.textContent?.trim() || '',
        answerVisible: !!widget.querySelector('[data-nc-shield-answer]') &&
          getComputedStyle(widget.querySelector('[data-nc-shield-answer]')).display !== 'none',
        googleHidden: !!google && (google.hidden || getComputedStyle(google).display === 'none'),
        status: widget.querySelector('[data-nc-shield-status]')?.textContent?.trim() || ''
      };
    });
    console.log('LOGIN_SECURITY_UI_INITIAL | ' + JSON.stringify(initial));
    assert.match(initial.title, /تأیید امنیتی NightCast/, 'Security challenge title is not visible');
    assert.ok(initial.question, 'Security question is empty');
    assert.ok(initial.answerVisible, 'Security answer input is not visible');
    assert.ok(initial.googleHidden, 'Google sign-in is visible before CAPTCHA completion');

    const answer = await page.evaluate(() => {
      const raw = document.querySelector('[data-nc-shield-question]').textContent;
      const normalized = raw.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
      const match = /(\d{1,2})\s*([+\-×x*])\s*(\d{1,2})/.exec(normalized);
      if (!match) return { raw, normalized, error: 'Unsupported challenge format' };
      const a = Number(match[1]), b = Number(match[3]);
      const result = match[2] === '+' ? a + b : match[2] === '-' ? a - b : a * b;
      return { value: String(result), raw, normalized };
    });
    assert.ok(answer.value, 'Could not parse the live security question: ' + JSON.stringify(answer));
    await page.locator('[data-nc-shield-answer]').fill(answer.value);
    await page.locator('[data-nc-shield-continue]').click();
    await page.waitForFunction(() => {
      const google = document.getElementById('googleLoginButton');
      return google && !google.hidden && google.dataset.captchaVerified === 'true' &&
        getComputedStyle(google).display !== 'none';
    }, { timeout: 10000 });

    const afterProof = await page.evaluate(() => ({
      googleVisible: getComputedStyle(document.getElementById('googleLoginButton')).display !== 'none',
      gate: document.getElementById('googleLoginButton').dataset.captchaVerified,
      status: document.querySelector('[data-nc-shield-status]')?.textContent?.trim() || ''
    }));
    console.log('LOGIN_SECURITY_UI_AFTER_PROOF | ' + JSON.stringify(afterProof));
    assert.equal(afterProof.gate, 'true', 'Google button was not unlocked by the security challenge');
    assert.ok(afterProof.googleVisible, 'Google button did not appear after the security challenge');

    const callback = await page.evaluate(async storageKey => {
      await window.NightCastLogin.googleCallback({
        credential: 'nightcast-google-return-regression-invalid-token'
      });
      return {
        message: document.querySelector('#loginMessage')?.textContent?.trim() || '',
        proofStillStored: Boolean(sessionStorage.getItem(storageKey))
      };
    }, STORAGE_KEY);
    console.log('LOGIN_GOOGLE_TOKEN_HANDOFF | ' + JSON.stringify(callback));
    assert.match(callback.message, /invalid google token/i,
      'The proof-gated callback did not reach backend token validation: ' + JSON.stringify(callback));
    assert.equal(callback.proofStillStored, false, 'Single-use CAPTCHA proof was not cleared after server response');
    assert.deepEqual(pageErrors, [], 'Uncaught browser errors: ' + JSON.stringify(pageErrors));
    console.log('PASS | visible security question, Google button gated by valid answer, and callback reaches server validation');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
