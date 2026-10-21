const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const API = 'https://nightcast-shield.tomasgermany2580.workers.dev/api/v1';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const failed = [];
    page.on('requestfailed', request => {
      if (request.url().startsWith(API)) failed.push({
        url: request.url(),
        error: request.failure()?.errorText || 'unknown'
      });
    });
    const navigation = await page.goto('https://nightcast.ir/users/login.html', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    assert.ok(navigation && navigation.status() < 500,
      'Live NightCast login page did not load successfully.');
    const result = await page.evaluate(async api => {
      const origin = window.location.origin;
      const challengeResponse = await fetch(api + '/captcha/challenge', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ action: 'login' })
      });
      const challenge = await challengeResponse.json().catch(() => ({}));
      if (!challengeResponse.ok || !challenge.success) {
        return {
          phase: 'challenge',
          status: challengeResponse.status,
          origin,
          allowOrigin: challengeResponse.headers.get('access-control-allow-origin'),
          data: challenge
        };
      }
      const match = /^(\d{1,2}) \+ (\d{1,2})/.exec(challenge.question || '');
      if (!match) return { phase: 'challenge-parse', status: challengeResponse.status, origin, data: challenge };
      const answer = String(Number(match[1]) + Number(match[2]));
      const response = await fetch(api + '/public/openid/google', {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          idToken: 'nightcast-live-origin-invalid-token-test',
          captcha: { id: challenge.id, answer }
        })
      });
      const data = await response.json().catch(() => ({}));
      return {
        phase: 'google-token-handoff',
        status: response.status,
        origin,
        allowOrigin: response.headers.get('access-control-allow-origin'),
        code: data.code || null,
        message: data.message || null,
        success: data.success === true
      };
    }, API);
    console.log('LIVE_ORIGIN_LOGIN_RESULT | ' + JSON.stringify(result));
    assert.equal(result.phase, 'google-token-handoff',
      'The live website could not complete the CAPTCHA-to-login API handoff: ' + JSON.stringify(result));
    // Fetch exposes only CORS-safelisted response headers to page JavaScript;
    // Access-Control-Allow-Origin is intentionally not readable via response.headers.
    // Reaching upstream token validation from the live origin is the browser-level CORS proof.
    assert.equal(result.status, 401,
      'An intentionally invalid Google token should reach the upstream validator and return HTTP 401: ' + JSON.stringify(result));
    assert.match(result.message || '', /invalid google token/i,
      'The API response did not prove that Google token validation was reached: ' + JSON.stringify(result));
    assert.deepEqual(failed, [], 'Browser reported network-level failures: ' + JSON.stringify(failed));
    console.log('PASS | Live nightcast.ir origin can reach CAPTCHA and Google token validation without CORS/network failure');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
