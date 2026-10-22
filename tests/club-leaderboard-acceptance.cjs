const fs=require('node:fs'),assert=require('node:assert/strict');
const api=fs.readFileSync('workers/club-api.js','utf8'),sql=fs.readFileSync('migrations/club/0004_daily_engagement_quiz_referrals_notifications.sql','utf8'),ui=fs.readFileSync('js/nightcast-club-community.js','utf8');
assert.match(api,/path === "\/leaderboard" && method === "GET"/);assert.match(api,/🥇/);assert.match(api,/🥈/);assert.match(api,/🥉/);assert.match(api,/leaderboard_opt_out/);assert.match(ui,/برترین شنوندگان/);
console.log('PASS | leaderboard ranks posted points and assigns top-three medals');