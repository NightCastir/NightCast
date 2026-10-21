const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const LOGIN_URL = process.env.NIGHTCAST_LOGIN_URL || 'https://nightcast.ir/users/login.html';
const API = 'https://nightcast-shield.tomasgermany2580.workers.dev/api/v1';
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
    await page.waitForFunction(() => window.NightCastLogin && typeof window.NightCastLogin.googleCallback === 'function', { timeout: 15000 });

    const result = await page.evaluate(async ({ api, storageKey }) => {
      const challengeResponse = await fetch(api + '/captcha/challenge', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ action: 'login' })
      });
      const challenge = await challengeResponse.json().catch(() => ({}));
      if (!challengeResponse.ok || !challenge.success || !challenge.id) {
        return { phase: 'challenge', status: challengeResponse.status, message: challenge.message || null };
      }
      const match = /^(\d{1,2})\s*\+\s*(\d{1,2})/.exec(challenge.question || '');
      if (!match) return { phase: 'challenge-parse', question: challenge.question || null };
      const proof = { id: challenge.id, answer: String(Number(match[1]) + Number(match[2])) };

      // Mimic a Google account chooser/redirect returning after the in-memory
      // Shield global has been lost, while same-tab sessionStorage survives.
      sessionStorage.setItem(storageKey, JSON.stringify(proof));
      window.NightCastLogin.captchaProof = null;
      window.NightCastShield = undefined;

      await window.NightCastLogin.googleCallback({
        credential: 'nightcast-google-return-regression-invalid-token'
      });
      return {
        phase: 'google-return-callback',
        message: document.querySelector('#loginMessage')?.textContent?.trim() || '',
        shieldGlobalAfterReturn: typeof window.NightCastShield,
        proofStillStored: Boolean(sessionStorage.getItem(storageKey))
      };
    }, { api: API, storageKey: STORAGE_KEY });

    console.log('GOOGLE_RETURN_PROOF_RESULT | ' + JSON.stringify(result));
    assert.equal(result.phase, 'google-return-callback',
      'Could not complete simulated Google return: ' + JSON.stringify(result));
    assert.match(result.message, /invalid google token/i,
      'Expected the intentionally invalid token to reach server validation; got a missing getProof/runtime error: ' + JSON.stringify(result));
    assert.doesNotMatch(result.message, /cannot read properties of undefined|proof|captcha/i,
      'Google return failed before token validation due to missing in-memory CAPTCHA state: ' + JSON.stringify(result));
    assert.deepEqual(pageErrors, [], 'Uncaught browser errors: ' + JSON.stringify(pageErrors));
    console.log('PASS | Google return restores CAPTCHA proof from sessionStorage when NightCastShield is unavailable and reaches server token validation');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
