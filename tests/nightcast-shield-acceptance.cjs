const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const BASE = (process.env.NIGHTCAST_SHIELD_API || 'https://nightcast-shield.tomasgermany2580.workers.dev/api/v1').replace(/\/$/, '');
const ACTION = process.env.NIGHTCAST_SHIELD_ACTION || 'login';
const targetByAction = {
  login: { path: '/public/openid/google', body: { idToken: 'nightcast-ci-invalid-id-token' } },
  comment: { path: '/public/podcasts/1/comments', body: { body: 'NightCast automated security test' } },
  suggestion: { path: '/book-summary-requests', body: { book_name: 'NightCast automated security test' } }
};

async function post(pathname, body) {
  const response = await fetch(BASE + pathname, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function run() {
  assert.ok(targetByAction[ACTION], `Unknown action: ${ACTION}`);
  const target = targetByAction[ACTION];

  const missing = await post(target.path, target.body);
  assert.equal(missing.status, 403, `protected endpoint must reject a missing CAPTCHA proof; got HTTP ${missing.status}: ${JSON.stringify(missing.data)}`);
  assert.equal(missing.data.code, 'CAPTCHA_REQUIRED', 'missing proof must be rejected by Shield before proxying');

  const challengeResponse = await post('/captcha/challenge', { action: ACTION });
  assert.equal(challengeResponse.status, 200, `challenge endpoint must respond successfully; got HTTP ${challengeResponse.status}: ${JSON.stringify(challengeResponse.data)}`);
  assert.equal(challengeResponse.data.success, true);
  assert.equal(challengeResponse.data.action, ACTION);
  assert.match(challengeResponse.data.id || '', /^[a-f0-9]{32}$/);
  const match = /^(\d{1,2}) \+ (\d{1,2})/.exec(challengeResponse.data.question || '');
  assert.ok(match, 'challenge should be a simple one-digit addition question');
  const correct = Number(match[1]) + Number(match[2]);
  const wrong = correct === 18 ? 1 : correct + 1;

  const wrongAnswer = await post(target.path, { ...target.body, captcha: { id: challengeResponse.data.id, answer: String(wrong) } });
  assert.equal(wrongAnswer.status, 403, 'wrong answer must be rejected');
  assert.equal(wrongAnswer.data.code, 'CAPTCHA_INVALID');

  const proof = { id: challengeResponse.data.id, answer: String(correct) };
  const accepted = await post(target.path, { ...target.body, captcha: proof });
  assert.notEqual(accepted.data.code, 'CAPTCHA_INVALID', 'correct answer should pass CAPTCHA verification');
  assert.notEqual(accepted.data.code, 'CAPTCHA_REQUIRED', 'correct proof should reach the upstream API');
  assert.notEqual(accepted.status, 502, 'proxy should reach the existing NightCast API');
  assert.notEqual(accepted.status, 503, 'Shield dependencies should be configured');

  const replay = await post(target.path, { ...target.body, captcha: proof });
  assert.equal(replay.status, 403, 'a successful challenge must not be reusable');
  assert.equal(replay.data.code, 'CAPTCHA_INVALID', 'replayed proof must be rejected by Shield');

  console.log(`PASS | ${ACTION} challenge, wrong answer, upstream handoff, and single-use replay protection`);
}

function staticChecks() {
  const read = p => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
  const index = read('index.html');
  const login = read('users/login.html');
  const app = read('js/nightcast-app.js');
  const player = read('js/nightcast-player.js');
  const loginJs = read('users/js/login.js');
  const widget = read('js/nightcast-shield.js');
  const worker = read('workers/nightcast-shield.js');
  assert.match(index, /data-nc-shield="comment"/);
  assert.match(index, /data-nc-shield="suggestion"/);
  assert.match(login, /data-nc-shield="login"/);
  assert.match(index, /nightcast-shield\.css/);
  assert.match(login, /nightcast-shield\.js/);
  assert.match(app, /getProof\("suggestion"\)/);
  assert.match(player, /getProof\("comment"\)/);
  assert.match(loginJs, /getProof\("login"\)/);
  assert.match(worker, /CAPTCHA_STORE/);
  assert.match(worker, /protectedAction/);
  assert.match(widget, /data-nc-shield-continue/);
  assert.match(widget, /requestSubmit\(\)/);
  assert.match(widget, /normalizeSubmitControls/);
  assert.match(widget, /ncCanonicalSubmit/);
  assert.match(index, /nightcast-shield\.js\?v=4/);
  assert.match(index, /id="ncCommentsSubmit"[^>]*type="submit"|id="ncCommentsSubmit"[^>]*type="submit"/);
  assert.match(index, /id="bookSummaryRequestSubmit"/);
  assert.match(loginJs, /continueWithCaptcha/);
  assert.match(widget, /if \(action === "login"\)/);
  assert.match(player, /NightCastSuccessDialog/);
  assert.match(app, /NightCastSuccessDialog/);
  assert.match(index, /nightcast-success-dialog\.css/);
  assert.match(index, /nightcast-success-dialog\.js/);
  assert.match(index, /id="ncCommentsSubmit"/);
  assert.match(index, /id="bookSummaryRequestSubmit"/);
  assert.match(read('css/nightcast-shield.css'), /--nc-theme-primary/);
  assert.match(read('css/nightcast-shield.css'), /max-width:480px/);
  assert.doesNotMatch(widget, /google\.com\/recaptcha|hcaptcha\.com|turnstile\.cloudflare\.com/i);
  console.log('PASS | static wiring for login, comments, suggestion, and self-hosted Shield');
}

if (process.argv.includes('--static')) {
  staticChecks();
} else {
  run().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
}
