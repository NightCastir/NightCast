const fs=require('node:fs'),assert=require('node:assert/strict');
const js=fs.readFileSync('js/nightcast-club-engagement.js','utf8'),api=fs.readFileSync('workers/club-api.js','utf8');
assert.match(js,/فرصت باقی‌مانده/);assert.match(js,/nc-quiz-countdown/);assert.match(js,/setInterval\(tick, 1000\)/);assert.match(js,/فرصت شرکت در سؤال روز باقیست/);
assert.match(api,/day_key=\?/);assert.match(api,/UNIQUE \(user_id, day_key\)/);
console.log('PASS | unanswered daily quiz reminder counts down to local midnight');