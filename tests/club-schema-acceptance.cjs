const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const migration = fs.readFileSync('migrations/club/0001_club_foundation.sql', 'utf8');
const sequenceMigration = fs.readFileSync('migrations/club/0002_listening_sequence_guard.sql', 'utf8');
const redemptionMigration = fs.readFileSync('migrations/club/0003_atomic_reward_redemption.sql', 'utf8');
const page = fs.readFileSync('club.html', 'utf8');
const css = fs.readFileSync('css/nightcast-club.css', 'utf8');
const client = fs.readFileSync('js/nightcast-club.js', 'utf8');
const listener = fs.readFileSync('js/nightcast-club-listener.js', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const adminPage = fs.readFileSync('club-admin.html', 'utf8');
const adminClient = fs.readFileSync('js/club-admin.js', 'utf8');
const clubEntry = fs.readFileSync('workers/club-api-entry.js', 'utf8');
const themeCss = fs.readFileSync('css/nightcast-themes.css', 'utf8');
const themeJs = fs.readFileSync('js/nightcast-theme.js', 'utf8');

function check(name, fn) {
  try { fn(); console.log('PASS | ' + name); }
  catch (error) { console.error('FAIL | ' + name + ' | ' + error.message); process.exitCode = 1; }
}
check('migration references existing users and podcasts, no parallel auth tables', function () {
  assert.match(migration, /REFERENCES users\(id\)/);
  assert.match(migration, /REFERENCES podcasts\(id\)/);
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS (users|sessions|user_sessions)\b/i);
});
check('point and XP ledgers enforce unique idempotency keys', function () {
  assert.match(migration, /club_point_ledger[\s\S]*?idempotency_key TEXT NOT NULL UNIQUE/);
  assert.match(migration, /club_experience_ledger[\s\S]*?idempotency_key TEXT NOT NULL UNIQUE/);
});
check('sensitive reward and mission features default disabled', function () {
  assert.match(migration, /\('club_enabled', 'false'\)/);
  assert.match(migration, /\('earning_enabled', 'false'\)/);
  assert.match(migration, /\('rewards_enabled', 'false'\)/);
});
check('seven Persian galaxy levels are seeded', function () {
  assert.equal((migration.match(/^  \([1-7], '/gm) || []).length, 7);
});
check('earned badges are evaluated only from accepted server-side listening metrics', function () {
  const api = fs.readFileSync('workers/club-api.js', 'utf8');
  assert.match(api, /async function awardEligibleBadges/);
  assert.match(api, /accepted_listen_events/);
  assert.match(api, /listening_minutes/);
  assert.match(api, /unique_podcasts/);
  assert.match(api, /INSERT OR IGNORE INTO club_user_badges/);
  assert.match(api, /if \(status === "accepted"\)/);
});
check('listening sequence migration adds replay protection without trusting client time', function () {
  assert.match(sequenceMigration, /ADD COLUMN sequence_number INTEGER/);
  assert.match(sequenceMigration, /ADD COLUMN received_at TEXT/);
  assert.match(sequenceMigration, /CREATE UNIQUE INDEX IF NOT EXISTS uq_club_activity_session_sequence/);
  assert.match(sequenceMigration, /WHERE session_key_hash IS NOT NULL AND sequence_number IS NOT NULL AND sequence_number > 0/);
  assert.match(sequenceMigration, /server receipt timestamps/);
});
check('club page uses the existing theme system and local brand assets', function () {
  assert.match(page, /nightcast-themes\.css/);
  assert.match(page, /nightcast-moonlight-contrast\.css/);
  assert.match(page, /nightcast-theme\.js/);
  assert.match(page, /assets\/icons\/icon-512\.png/);
  assert.doesNotMatch(page, /https?:\/\/.*(unsplash|fonts\.googleapis|cdnjs)/i);
});
check('club styles use theme tokens and support reduced motion', function () {
  assert.match(css, /var\(--nc-theme-primary\)/);
  assert.match(css, /var\(--nc-theme-surface\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  ['midnight-cosmos','moonlight','aurora','studio-noir','deep-ocean','royal-gold','neon-city','persian-heritage'].forEach(function (theme) {
    assert.ok(themeCss.indexOf('data-theme="' + theme + '"') >= 0, 'missing theme token: ' + theme);
  });
  assert.match(themeJs, /nightcast:themechange/);
});
check('client never fabricates reward values and handles missing API honestly', function () {
  assert.match(client, /request\('\/club\/summary'\)/);
  assert.match(client, /loadSection\('\/club\/missions'/);
  assert.match(client, /loadSection\('\/club\/badges'/);
  assert.match(client, /loadSection\('\/club\/rewards'/);
  assert.match(client, /\/club\/missions\//);
  assert.match(client, /\/club\/rewards\//);
  assert.match(client, /loadSection\('\/club\/ledger\?limit=20'/);
  assert.match(client, /summary\.badges_earned/);
  assert.match(client, /summary\.next_level/);
  assert.match(client, /API باشگاه هنوز در Worker مستقر نشده است/);
  assert.match(client, /No client-side points, XP, missions or rewards are fabricated/);
  assert.doesNotMatch(client, /clubPoints\s*[:=]\s*[0-9]+/);
  assert.match(client, /club-api\.nightcast\.ir\/api\/v1/);
  assert.match(page, /nightcast-club\.css\?v=\d+/);
  assert.match(page, /nightcast-club\.js\?v=\d+/);
  assert.match(page, /clubRewards/);
  assert.match(listener, /club-api\.nightcast\.ir/);
  assert.match(listener, /nightcast:podcastchange/);
  assert.match(listener, /sequence_number/);
  assert.match(home, /nightcast-club-listener\.js\?v=2/);
  // The home page may inline the main application; only require the club listener
  // integration here rather than assuming a separate nightcast-app.js bundle exists.
  assert.ok(home.includes('<script src="/js/nightcast-club-listener.js?v=2" defer></script>'));
  assert.match(adminClient, /club-api\.nightcast\.ir/);
  assert.match(adminPage, /club-admin\.js\?v=3/);
});
check('both migrations apply cleanly against the existing user/podcast table contract', function () {
  const sql = 'PRAGMA foreign_keys=ON; CREATE TABLE users(id INTEGER PRIMARY KEY); CREATE TABLE podcasts(id INTEGER PRIMARY KEY);' + migration + sequenceMigration + redemptionMigration + ' SELECT name FROM sqlite_master WHERE type="table";';
  const output = execFileSync('python3', ['-c', 'import sqlite3,sys; c=sqlite3.connect(\":memory:\"); c.executescript(sys.stdin.read()); print(\"OK\")'], { input: sql, encoding: 'utf8' });
  assert.match(output, /OK/);
});
check('listening sequence unique index rejects a replayed sequence within the same session', function () {
  const sql = 'PRAGMA foreign_keys=ON; CREATE TABLE users(id INTEGER PRIMARY KEY); CREATE TABLE podcasts(id INTEGER PRIMARY KEY);' + migration + sequenceMigration + redemptionMigration;
  const py = `import sqlite3,sys
c=sqlite3.connect(":memory:")
c.executescript(sys.stdin.read())
c.execute("INSERT INTO users(id) VALUES(7)")
c.execute("INSERT INTO club_activity_events(id,user_id,event_type,session_key_hash,sequence_number,idempotency_key) VALUES(?,?,?,?,?,?)", ("e1",7,"listen","session-hash",1,"idem-1"))
try:
 c.execute("INSERT INTO club_activity_events(id,user_id,event_type,session_key_hash,sequence_number,idempotency_key) VALUES(?,?,?,?,?,?)", ("e2",7,"listen","session-hash",1,"idem-2"))
 raise SystemExit("duplicate sequence unexpectedly accepted")
except sqlite3.IntegrityError:
 print("DUPLICATE_BLOCKED")`;
  const output = execFileSync('python3', ['-c', py], { input: sql, encoding: 'utf8' });
  assert.match(output, /DUPLICATE_BLOCKED/);
});
check('dedicated production entry point reuses valid shared sessions and does not expose token creation', function () {
  assert.match(clubEntry, /handleClubApi/);
  assert.match(clubEntry, /env\.NightCastBinding/);
  assert.match(clubEntry, /FROM user_sessions/);
  assert.match(clubEntry, /FROM admin_sessions/);
  assert.match(clubEntry, /julianday\(.*expires_at\).*julianday\('now'\)/);
  assert.doesNotMatch(clubEntry, /INSERT INTO user_sessions|INSERT INTO admin_sessions/);
});
check('tracked API worker snapshot preserves existing D1 and auth integration points', function () {
  const worker = fs.readFileSync('workers/nightcast-api.js', 'utf8');
  assert.match(worker, /const DB = env\.NightCastBinding/);
  assert.match(worker, /async function checkAuth\(\)/);
  assert.match(worker, /\/api\/v1\/public\/openid\/google/);
  assert.match(worker, /FROM user_sessions/);
  assert.match(worker, /FROM admin_sessions/);
});
