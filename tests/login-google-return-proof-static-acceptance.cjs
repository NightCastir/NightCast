const fs=require('node:fs');const assert=require('node:assert/strict');
const login=fs.readFileSync('users/js/login.js','utf8'),html=fs.readFileSync('users/login.html','utf8');
assert.doesNotMatch(login,/getCaptchaProof|captchaProof|NightCastShield|continueWithCaptcha/);
assert.match(login,/body: JSON\.stringify\(\{ idToken \}\)/);
assert.doesNotMatch(html,/nc-shield-widget|nightcast-shield\.(?:css|js)/);
assert.match(html,/login\.js\?v=[^"']+/);
console.log('PASS | Google return flow does not depend on CAPTCHA state');
