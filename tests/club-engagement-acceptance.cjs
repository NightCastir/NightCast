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
const referrals = fs.readFileSync('js/nightcast-referrals.js','utf8');
const home = fs.readFileSync('index.html','utf8');
const checks = {
  'daily-checkin': () => {
    assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS club_daily_checkins'));
    assert.ok(migration.includes('UNIQUE(user_id, checkin_day)'));
    assert.ok(api.includes('path === "/checkin"'));
    assert.ok(api.includes('club-checkin:'));
    assert.ok(home.includes('nightcast-club-listener.js?v=2'));
  },
  quiz: () => {
    assert.equal(questions.questions.length,30);
    assert.equal(new Set(questions.questions.map(q=>q.id)).size,questions.questions.length);
    for (const q of questions.questions) {
      assert.equal(q.options.length,4,q.id+' must have four options');
      assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,q.id+' answer index invalid');
      assert.ok(q.question.length>10&&q.explanation.length>10,q.id+' text missing');
    }
    assert.ok(migration.includes('UNIQUE(user_id, shown_day)'));
    assert.ok(migration.includes('UNIQUE(user_id, question_id)'));
    assert.ok(api.includes('path === "/quiz/today"'));
    assert.ok(api.includes("datetime('now','-24 hours')"));
    assert.ok(api.includes('path === "/quiz/answer"'));
    assert.ok(api.includes('club-quiz:'));
    assert.ok(quizPage.includes('qCountdown'));
    assert.ok(quizClient.includes("body.classList.add('q-wrong')"));
  },
  referrals: () => {
    assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS club_referrals'));
    assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS club_invite_codes'));
    assert.ok(api.includes('path === "/referrals/code"'));
    assert.ok(api.includes('path === "/referrals/claim"'));
    assert.ok(referrals.includes('NightCastReferralPending'));
    assert.ok(api.includes('referral-invitee-'));
    assert.ok(migration.includes('invitee_user_id INTEGER NOT NULL UNIQUE'));
    assert.ok(migration.includes('CHECK(inviter_user_id <> invitee_user_id)'));
    assert.ok(migration.includes("status TEXT NOT NULL DEFAULT 'pending'"));
  },
  share: () => {
    assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS club_share_events'));
    assert.ok(migration.includes("'native','sms','whatsapp','telegram','soroush','copy','other'"));
    assert.ok(!/CREATE TABLE[^;]*(sms_messages|whatsapp_contacts|telegram_contacts)/i.test(migration));
    assert.ok(app.includes('navigator.share'));
    assert.ok(app.includes('data-action="share"'));
    assert.ok(app.includes('/club/share-events'));
    assert.ok(api.includes('path === "/share-events"'));
    assert.ok(home.includes('id="ncNowShare"'));
  },
  notifications: () => {
    assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS club_push_subscriptions'));
    assert.ok(migration.includes('subscription_json TEXT NOT NULL'));
    assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS club_notification_events'));
    assert.ok(migration.includes('UNIQUE(user_id, notification_key)'));
    assert.ok(api.includes('path === "/notifications"'));
    assert.ok(referrals.includes('setInterval(pollNotifications,60000)'));
  },
  leaderboard: () => {
    assert.ok(api.includes('club_point_ledger'));
    assert.ok(api.includes('path === "/leaderboard"'));
    assert.ok(api.includes('medal:index===0'));
    assert.ok(leaderboardPage.includes('برترین شنوندگان'));
    assert.ok(migration.includes('CREATE INDEX IF NOT EXISTS idx_club_referrals_inviter'));
    assert.ok(migration.includes('REFERENCES users(id)'));
  }
};
const selected = feature === 'all' ? Object.keys(checks) : [feature];
for (const name of selected) {
  assert.ok(checks[name], 'Unknown CLUB_FEATURE ' + name);
  checks[name]();
  console.log('PASS | ' + name + ' schema/content contract');
}
const sql = 'PRAGMA foreign_keys=ON; CREATE TABLE users(id INTEGER PRIMARY KEY); CREATE TABLE podcasts(id INTEGER PRIMARY KEY); CREATE TABLE club_point_ledger(id INTEGER PRIMARY KEY, user_id INTEGER, delta INTEGER, status TEXT);' + migration;
execFileSync('python3', ['-c', `import sqlite3,sys
c=sqlite3.connect(":memory:")
c.execute("PRAGMA foreign_keys=ON")
c.executescript(sys.stdin.read())
assert c.execute("PRAGMA integrity_check").fetchone()[0]=="ok"
print("SQLITE_MIGRATION_OK")`], {input:sql, encoding:'utf8'});
console.log('PASS | migration applies to existing users/podcasts contract');
