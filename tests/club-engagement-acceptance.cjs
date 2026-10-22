const fs = require('node:fs');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const feature = process.env.CLUB_FEATURE || 'all';
const questions = JSON.parse(fs.readFileSync('data/club-quiz-questions.json','utf8'));
const migration = fs.readFileSync('migrations/club/0004_engagement.sql','utf8');
const api = fs.readFileSync('workers/club-api.js','utf8');
const quizPage = fs.readFileSync('quiz.html','utf8');
const quizClient = fs.readFileSync('js/nightcast-quiz.js','utf8');
const leaderboardPage = fs.readFileSync('leaderboard.html','utf8');
const app = fs.readFileSync('js/nightcast-app.js','utf8');
const home = fs.readFileSync('index.html','utf8');
const checks = {
  'daily-checkin': () => {
    assert.match(migration,/CREATE TABLE IF NOT EXISTS club_daily_checkins/);
    assert.match(migration,/UNIQUE\(user_id, checkin_day\)/);
    assert.match(migration,/points_awarded INTEGER NOT NULL DEFAULT 0 CHECK\(points_awarded >= 0\)/);
  },
  quiz: () => {
    assert.equal(questions.questions.length,30);
    assert.equal(new Set(questions.questions.map(q=>q.id)).size,questions.questions.length);
    for (const q of questions.questions) {
      assert.equal(q.options.length,4,q.id+' must have four options');
      assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,q.id+' answer index invalid');
      assert.ok(q.question.length>10&&q.explanation.length>10,q.id+' text missing');
    }
    assert.match(migration,/UNIQUE\(user_id, shown_day\)/);
    assert.match(migration,/UNIQUE\(user_id, question_id\)/);
    assert.match(migration,/UNIQUE\(user_id, question_id\)[\s\S]*?FOREIGN KEY\(user_id, question_id\)/);
  },
  referrals: () => {
    assert.match(migration,/CREATE TABLE IF NOT EXISTS club_referrals/);
    assert.match(migration,/invitee_user_id INTEGER NOT NULL UNIQUE/);
    assert.match(migration,/CHECK\(inviter_user_id <> invitee_user_id\)/);
    assert.match(migration,/status TEXT NOT NULL DEFAULT 'pending'/);
  },
  share: () => {
    assert.match(migration,/CREATE TABLE IF NOT EXISTS club_share_events/);
    assert.match(migration,/channel IN \('native','sms','whatsapp','telegram','soroush','copy','other'\)/);
    assert.doesNotMatch(migration,/CREATE TABLE[^;]*(sms_messages|whatsapp_contacts|telegram_contacts)/i);
    assert.match(app,/navigator.share/);
    assert.match(app,/data-action="share"/);
    assert.match(home,/id="ncNowShare"/);
  },
  notifications: () => {
    assert.match(migration,/CREATE TABLE IF NOT EXISTS club_push_subscriptions/);
    assert.match(migration,/subscription_json TEXT NOT NULL/);
    assert.match(migration,/CREATE TABLE IF NOT EXISTS club_notification_events/);
    assert.match(migration,/UNIQUE\(user_id, notification_key\)/);
  },
  leaderboard: () => {
    assert.match(migration,/club_point_ledger/);
    assert.match(api,/path === "\\/leaderboard"/);
    assert.match(api,/medal:index===0/);
    assert.match(leaderboardPage,/برترین شنوندگان/);
    assert.match(migration,/CREATE INDEX IF NOT EXISTS idx_club_referrals_inviter/);
    assert.match(migration,/REFERENCES users\(id\)/);
  }
};
const selected = feature==='all' ? Object.keys(checks) : [feature];
for (const name of selected) {
  assert.ok(checks[name], 'Unknown CLUB_FEATURE '+name);
  checks[name]();
  console.log('PASS | '+name+' schema/content contract');
}
const sql = 'PRAGMA foreign_keys=ON; CREATE TABLE users(id INTEGER PRIMARY KEY); CREATE TABLE podcasts(id INTEGER PRIMARY KEY); CREATE TABLE club_point_ledger(id INTEGER PRIMARY KEY, user_id INTEGER, delta INTEGER, status TEXT);'+migration;
execFileSync('python3',['-c',`import sqlite3,sys
c=sqlite3.connect(":memory:")
c.execute("PRAGMA foreign_keys=ON")
c.executescript(sys.stdin.read())
assert c.execute("PRAGMA integrity_check").fetchone()[0]=="ok"
print("SQLITE_MIGRATION_OK")`],{input:sql,encoding:'utf8'});
console.log('PASS | migration applies to existing users/podcasts contract');
