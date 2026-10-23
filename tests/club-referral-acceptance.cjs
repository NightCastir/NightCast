const fs=require('node:fs'),assert=require('node:assert/strict');
const api=fs.readFileSync('workers/club-api.js','utf8'),sql=fs.readFileSync('migrations/club/0004_daily_engagement_quiz_referrals_notifications.sql','utf8'),ui=fs.readFileSync('js/nightcast-club-community.js','utf8');
assert.match(api,/path === "\/referral" && method === "GET"/);assert.match(api,/path === "\/referral\/claim" && method === "POST"/);
assert.match(sql,/invited_user_id INTEGER NOT NULL UNIQUE/);assert.match(api,/club-referral-inviter:/);assert.match(api,/club_notifications/);assert.match(ui,/invite_url/);
console.log('PASS | referral codes are one-use per invited account and ledger-backed');