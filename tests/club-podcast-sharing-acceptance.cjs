const fs=require('node:fs'),assert=require('node:assert/strict');
const app=fs.readFileSync('js/nightcast-app.js','utf8'),html=fs.readFileSync('index.html','utf8'),share=fs.readFileSync('js/nightcast-sharing.js','utf8');
assert.match(app,/data-action="share"/);assert.match(html,/data-action="share-current"/);assert.match(html,/nightcast-sharing\.js/);
assert.match(share,/navigator\.share/);assert.match(share,/navigator\.clipboard/);assert.match(share,/data\.url/);
assert.doesNotMatch(share,/READ_SMS|READ_CONTACTS|queryAllContacts/i);
console.log('PASS | podcast cards and player use platform Sharesheet with safe clipboard fallback');