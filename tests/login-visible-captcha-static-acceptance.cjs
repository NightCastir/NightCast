const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('users/login.html', 'utf8');
const login = fs.readFileSync('users/js/login.js', 'utf8');
const shield = fs.readFileSync('js/nightcast-shield.js', 'utf8');

assert.match(html, /class="nc-shield-widget" data-nc-shield="login"[^>]*>[\s\S]*data-nc-shield-question/,
  'Login HTML must contain visible static security-question fallback markup');
assert.match(html, /data-nc-shield-answer/, 'Login HTML must contain a security answer input');
assert.match(html, /nightcast-shield\.css\?v=4/, 'Security CSS cache key was not bumped');
assert.match(html, /nightcast-shield\.js\?v=4/, 'Security JavaScript cache key was not bumped');
assert.match(html, /login\.js\?v=20261022-visible-captcha-gated-google2/,
  'Login controller cache key was not bumped');
assert.match(login, /container\.style\.display = "none"[\s\S]{0,100}container\.hidden = true/,
  'Google sign-in must be hidden before security challenge completion');
assert.match(login, /container\.setAttribute\("data-captcha-verified", "true"\)/,
  'Google sign-in must be explicitly unlocked only after CAPTCHA proof');
assert.doesNotMatch(login, /window\.google\.accounts\.id\.prompt\(/,
  'Automatic Google prompt could bypass the visible, user-completed security step');
assert.match(shield, /widget\.replaceChildren\(title, questionRow, label, actions, status\)/,
  'Security widget must build the live question, answer, actions and status');
console.log('PASS | static login challenge markup, cache busting and CAPTCHA-gated Google button guards');
