const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const API = 'https://nightcast-shield.tomasgermany2580.workers.dev/api/v1';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.on('requestfailed', request => {
      if (request.url().startsWith(API)) console.log('REQUEST_FAILED | ' + request.url() + ' | ' + (request.failure()?.errorText || 'unknown'));
    });
    await page.goto('http://127.0.0.1:4173/users/login.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
    const result = await page.evaluate(async (api) => {
      const challengeResponse = await fetch(api + '/captcha/challenge', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ action: 'login' })
      });
      const challenge = await challengeResponse.json();
      if (!challengeResponse.ok || !challenge.success) {
        return { phase: 'challenge', status: challengeResponse.status, data: challenge };
      }
      const match = /^(\d{1,2}) \+ (\d{1,2})/.exec(challenge.question || '');
      if (!match) return { phase: 'challenge-parse', status: challengeResponse.status, data: challenge };
      const answer = String(Number(match[1]) + Number(match[2]));
      const response = await fetch(api + '/public/openid/google', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          idToken: 'nightcast-browser-cors-test-invalid-token',
          captcha: { id: challenge.id, answer }
        })
      });
      const data = await response.json().catch(() => ({}));
      return {
        phase: 'google-token-handoff',
        status: response.status,
        cors: response.headers.get('access-control-allow-origin'),
        code: data.code || null,
        message: data.message || null,
        success: data.success === true
      };
    }, API);
    console.log('LOGIN_BROWSER_API_RESULT | ' + JSON.stringify(result));
    assert.equal(result.phase, 'google-token-handoff',
      'Browser could not complete challenge/handoff: ' + JSON.stringify(result));
    assert.ok(result.cors === '*' || result.cors === 'http://127.0.0.1:4173',
      'Google login API response did not expose CORS headers: ' + JSON.stringify(result));
    assert.notEqual(result.code, 'CAPTCHA_REQUIRED', 'valid proof was not passed to Shield');
    assert.notEqual(result.code, 'CAPTCHA_INVALID', 'valid proof was rejected by Shield');
    assert.notEqual(result.status, 502, 'Shield could not reach NightCast API');
    assert.notEqual(result.status, 503, 'Shield/API service is unavailable');
    console.log('PASS | Browser CORS, CAPTCHA proof and Google token handoff reach the API without a network-level error');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
