const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const migration = fs.readFileSync('migrations/club/0001_club_foundation.sql', 'utf8');
const page = fs.readFileSync('club.html', 'utf8');
const css = fs.readFileSync('css/nightcast-club.css', 'utf8');
const client = fs.readFileSync('js/nightcast-club.js', 'utf8');
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
  assert.match(client, /API باشگاه هنوز در Worker مستقر نشده است/);
  assert.match(client, /No client-side points, XP, missions or rewards are fabricated/);
  assert.doesNotMatch(client, /clubPoints\s*[:=]\s*[0-9]+/);
});
check('migration applies cleanly against the existing user/podcast table contract', function () {
  const sql = 'PRAGMA foreign_keys=ON; CREATE TABLE users(id INTEGER PRIMARY KEY); CREATE TABLE podcasts(id INTEGER PRIMARY KEY);' + migration + ' SELECT name FROM sqlite_master WHERE type="table";';
  const output = execFileSync('python3', ['-c', 'import sqlite3,sys; c=sqlite3.connect(\":memory:\"); c.executescript(sys.stdin.read()); print(\"OK\")'], { input: sql, encoding: 'utf8' });
  assert.match(output, /OK/);
});

check('tracked API worker snapshot preserves existing D1 and auth integration points', function () {
  const worker = fs.readFileSync('workers/nightcast-api.js', 'utf8');
  assert.match(worker, /const DB = env\.NightCastBinding/);
  assert.match(worker, /async function checkAuth\(\)/);
  assert.match(worker, /\/api\/v1\/public\/openid\/google/);
  assert.match(worker, /FROM user_sessions/);
  assert.match(worker, /FROM admin_sessions/);
});
