const fs=require('node:fs'),assert=require('node:assert/strict');
const bank=JSON.parse(fs.readFileSync('data/club/daily-questions.json','utf8')),api=fs.readFileSync('workers/club-api.js','utf8'),sql=fs.readFileSync('migrations/club/0004_daily_engagement_quiz_referrals_notifications.sql','utf8'),ui=fs.readFileSync('js/nightcast-quiz.js','utf8');
assert.ok(bank.questions.length>=20);assert.equal(new Set(bank.questions.map(q=>q.id)).size,bank.questions.length);
for(const q of bank.questions){assert.equal(q.options.length,4);assert.ok(q.correctIndex>=0&&q.correctIndex<4);}
assert.match(api,/path === "\/quiz\/today" && method === "GET"/);assert.match(api,/path === "\/quiz\/answer" && method === "POST"/);
assert.match(sql,/UNIQUE \(user_id, day_key\)/);assert.match(sql,/UNIQUE \(user_id, question_id\)/);assert.match(api,/answered_at IS NULL/);assert.match(api,/datetime\('now','-24 hours'\)/);assert.match(ui,/input\.disabled=true/);
console.log('PASS | question bank, per-day session, no-repeat history and locked answers');