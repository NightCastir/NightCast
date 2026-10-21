const { chromium }=require('playwright'); const assert=require('node:assert/strict');
const URL=process.env.NIGHTCAST_LOGIN_URL||'https://nightcast.ir/users/login.html';
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{try{localStorage.removeItem('NightCastToken');localStorage.removeItem('NightCastUser')}catch(_){}});
 await page.route('https://accounts.google.com/gsi/client?hl=fa',route=>route.fulfill({status:200,contentType:'application/javascript',body:`window.google={accounts:{id:{initialize(c){window.__ncCallback=c.callback},renderButton(el){const b=document.createElement('button');b.id='mockGoogleButton';b.textContent='ادامه از طریق گوگل';b.onclick=()=>window.__ncCallback({credential:'nightcast-google-only-invalid-token'});el.appendChild(b)},prompt(){}}}};`}));
 const nav=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});assert.ok(nav&&nav.status()<400);
 await page.locator('#mockGoogleButton').waitFor({state:'visible',timeout:15000});
 const before=await page.evaluate(()=>({challenge:!!document.querySelector('[data-nc-shield="login"],[data-nc-shield-question],[data-nc-shield-answer]'),buttons:document.querySelectorAll('#googleLoginButton button,#googleLoginButton iframe').length,text:document.querySelector('#mockGoogleButton')?.textContent?.trim()}));
 assert.equal(before.challenge,false);assert.equal(before.buttons,1);assert.match(before.text,/ادامه از طریق گوگل/);
 await page.locator('#mockGoogleButton').click();
 await page.waitForFunction(()=>/invalid google token/i.test(document.querySelector('#loginMessage')?.textContent||''),{timeout:15000});
 const result=await page.evaluate(()=>document.querySelector('#loginMessage')?.textContent?.trim()||'');
 assert.match(result,/invalid google token/i,'Token did not reach API validation');assert.deepEqual(errors,[]);
 console.log('GOOGLE_ONLY_LOGIN_UI | '+JSON.stringify({before,message:result,errors}));
 console.log('PASS | One Google sign-in button works without a security-question step');
}finally{await browser.close()}})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
