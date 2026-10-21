const fs = require('node:fs');
const assert = require('node:assert/strict');

const login = fs.readFileSync('users/js/login.js', 'utf8');
const html = fs.readFileSync('users/login.html', 'utf8');

assert.match(login, /getCaptchaProof\s*\(\s*\)/,
  'Login controller must provide a guarded CAPTCHA proof recovery method');
assert.match(login, /captchaProofStorageKey\s*:\s*["']nightcast\.login\.captchaProof\.v1["']/,
  'The session-scoped proof storage key is missing');
assert.match(login, /sessionStorage\.setItem\(this\.captchaProofStorageKey/,
  'CAPTCHA proof must be preserved before Google is opened');
assert.match(login, /sessionStorage\.getItem\(this\.captchaProofStorageKey/,
  'CAPTCHA proof must be restored after a Google return/reload');
assert.match(login, /const shield\s*=\s*window\.NightCastShield[\s\S]{0,220}if\s*\(shield\s*&&\s*typeof shield\.getProof\s*===\s*["']function["']\)/,
  'Shield access must be guarded before calling getProof');
assert.match(login, /const captchaProof\s*=\s*this\.getCaptchaProof\(\)/,
  'Google token handoff must use proof recovery rather than dereferencing NightCastShield directly');
assert.match(login, /clearCaptchaProof\s*\(\)/,
  'Single-use proof must be cleared after the server responds');
assert.match(html, /login\.js\?v=20261021-google-return-proof1/,
  'Login page must use the cache-busted fix');
assert.doesNotMatch(login, /window\.NightCastShield\.getProof\(["']login["']\)/,
  'Unsafe direct Shield getProof dereference remains');

console.log('PASS | Google return proof persistence, guarded Shield access, single-use cleanup and cache-busting are present');
