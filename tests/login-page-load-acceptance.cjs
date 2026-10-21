const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const URL = process.env.NIGHTCAST_LOGIN_URL || 'https://nightcast.ir/users/login.html';
(async () => {
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
  assert.ok(response&&response.status()>=200&&response.status()<400,'Login page did not load');
  await page.locator('.login-card').waitFor({state:'visible',timeout:10000});
  await page.locator('#loginTitle').waitFor({state:'visible',timeout:5000});
  await page.locator('#googleLoginButton').waitFor({state:'visible',timeout:15000});
  const state=await page.evaluate(()=>({title:document.title,heading:document.querySelector('#loginTitle')?.innerText?.trim(),cardVisible:!!document.querySelector('.login-card')?.getClientRects().length,googleVisible:!!document.querySelector('#googleLoginButton')?.getClientRects().length,challengePresent:!!document.querySelector('[data-nc-shield="login"],[data-nc-shield-question],[data-nc-shield-answer]'),statusPresent:!!document.querySelector('#loginMessage'),width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.match(state.title,/NightCast/i); assert.ok(state.heading); assert.equal(state.cardVisible,true); assert.equal(state.googleVisible,true); assert.equal(state.challengePresent,false,'Login must not render a security question'); assert.equal(state.statusPresent,true); assert.ok(state.scrollWidth<=state.width+1,'Horizontal overflow: '+JSON.stringify(state)); assert.deepEqual(errors,[]);
  console.log('GOOGLE_ONLY_LOGIN_PAGE | '+JSON.stringify({status:response.status(),...state,errors}));
  console.log('PASS | Login page is Google-only and contains no CAPTCHA UI');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
