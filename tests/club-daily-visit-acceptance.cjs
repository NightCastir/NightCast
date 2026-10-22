const fs=require('node:fs'),assert=require('node:assert/strict');
const api=fs.readFileSync('workers/club-api.js','utf8'),sql=fs.readFileSync('migrations/club/0004_daily_engagement_quiz_referrals_notifications.sql','utf8');
assert.match(api,/path === "\/daily-visit" && method === "POST"/);
assert.match(api,/club-daily-visit:/);assert.match(api,/INSERT OR IGNORE INTO club_daily_visits/);
assert.match(sql,/PRIMARY KEY \(user_id, visit_day\)/);assert.match(sql,/daily_visit_reward_points/);
console.log('PASS | daily visit is server-awarded and unique per account/day');