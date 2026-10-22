const fs=require('node:fs'),assert=require('node:assert/strict');
const api=fs.readFileSync('workers/club-api.js','utf8'),sql=fs.readFileSync('migrations/club/0004_daily_engagement_quiz_referrals_notifications.sql','utf8');
assert.match(api,/requireMember\(checkAuth\)/);assert.match(api,/club-daily-quiz:/);assert.match(api,/club-daily-visit:/);assert.match(api,/INSERT OR IGNORE INTO club_point_ledger/);
assert.match(sql,/PRIMARY KEY \(user_id, visit_day\)/);assert.match(sql,/UNIQUE \(user_id, day_key\)/);assert.match(sql,/UNIQUE \(user_id, question_id\)/);
console.log('PASS | earning routes require a member session and use idempotency keys');