const fs = require('node:fs');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const root = process.cwd();
const migrations = [
  fs.readFileSync('migrations/club/0001_club_foundation.sql', 'utf8'),
  fs.readFileSync('migrations/club/0002_listening_sequence_guard.sql', 'utf8'),
  fs.readFileSync('migrations/club/0003_atomic_reward_redemption.sql', 'utf8')
].join('\n');
const source = fs.readFileSync('workers/club-api.js', 'utf8');

function check(name, fn) {
  try { fn(); console.log('PASS | ' + name); }
  catch (error) { console.error('FAIL | ' + name + ' | ' + error.message); process.exitCode = 1; }
}

function responseJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=UTF-8' }
  });
}

function makeDb(settings = {}) {
  const calls = { all: 0, first: 0, run: 0, batch: 0 };
  const db = {
    calls,
    prepare(sql) {
      const stmt = {
        sql, args: [],
        bind(...args) { this.args = args; return this; },
        async first() {
          calls.first++;
          if (sql.includes('FROM club_settings')) return settings[this.args[0]] === undefined ? null : { setting_value: settings[this.args[0]] };
          if (sql.includes('FROM club_profiles')) return { display_name: 'Listener', leaderboard_opt_out: 0, notifications_enabled: 0 };
          if (sql.includes('SUM(delta)') && sql.includes('club_point_ledger')) return { total: 20 };
          if (sql.includes('SUM(delta)') && sql.includes('club_experience_ledger')) return { total: 180 };
          if (sql.includes('COUNT(*)') && sql.includes('club_missions')) return { total: 2 };
          if (sql.includes('COUNT(*)') && sql.includes('club_user_badges')) return { total: 1 };
          if (sql.includes('FROM podcasts')) return { id: this.args[0] };
          if (sql.includes('FROM club_activity_events') && sql.includes('idempotency_key')) return null;
          if (sql.includes('FROM club_activity_events') && sql.includes('ORDER BY sequence_number')) return { sequence_number: 5, received_at: new Date(Date.now() - 60000).toISOString().replace('T', ' ').replace('Z', '') };
          return null;
        },
        async all() {
          calls.all++;
          if (sql.includes('FROM club_levels')) return { results: [
            { level: 1, slug: 'new', title_fa: 'شنونده تازه‌وارد', min_xp: 0 },
            { level: 2, slug: 'wanderer', title_fa: 'رهرو صدا', min_xp: 150 },
            { level: 3, slug: 'moon', title_fa: 'کاوشگر ماه', min_xp: 400 }
          ] };
          return { results: [] };
        },
        async run() { calls.run++; return { success: true, meta: { changes: 1 } }; }
      };
      return stmt;
    },
    async batch(statements) { calls.batch++; return statements.map(() => ({ success: true })); }
  };
  return db;
}

async function apiTests() {
  const encoded = Buffer.from(source).toString('base64');
  const { handleClubApi } = await import('data:text/javascript;base64,' + encoded);
  const urlFor = path => new URL('https://nightcast.ir/api/v1/club' + path);
  const req = (path, method = 'GET', body = undefined) => new Request('https://nightcast.ir/api/v1/club' + path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  let db = makeDb();
  let result = await handleClubApi({
    request: req('/summary'), url: urlFor('/summary'), DB: db,
    json: responseJson, checkAuth: async () => null
  });
  assert.equal(result.status, 401);
  assert.equal(db.calls.first, 0, 'unauthenticated requests must not read member data');

  db = makeDb();
  result = await handleClubApi({
    request: req('/summary'), url: urlFor('/summary'), DB: db,
    json: responseJson, checkAuth: async () => ({ id: 7, role: 'admin' })
  });
  assert.equal(result.status, 403, 'admin session must not be treated as a member identity');

  db = makeDb({ club_enabled: 'false', earning_enabled: 'false', rewards_enabled: 'false' });
  result = await handleClubApi({
    request: req('/summary'), url: urlFor('/summary'), DB: db,
    json: responseJson, checkAuth: async () => ({ id: 7, role: 'user' })
  });
  const summary = await result.json();
  assert.equal(result.status, 200);
  assert.equal(summary.points, 20);
  assert.equal(summary.xp, 180);
  assert.equal(summary.level.level, 2);
  assert.equal(summary.enabled, false);

  db = makeDb({ club_enabled: 'true', earning_enabled: 'false', rewards_enabled: 'false' });
  result = await handleClubApi({
    request: req('/listen-events', 'POST', { event_id: 'event_id_000001', session_id: 'session_id_0001', sequence_number: 5, podcast_id: 1 }),
    url: urlFor('/listen-events'), DB: db, json: responseJson,
    checkAuth: async () => ({ id: 7, role: 'user' })
  });
  assert.equal(result.status, 409, 'same or lower sequence must be rejected');
  assert.equal(db.calls.batch, 0, 'replayed sequence must not write an event or ledger entry');

  db = makeDb({ club_enabled: 'true', rewards_enabled: 'false' });
  result = await handleClubApi({
    request: req('/rewards/reward-1/redeem', 'POST', { idempotency_key: 'request_key_0001' }),
    url: urlFor('/rewards/reward-1/redeem'), DB: db, json: responseJson,
    checkAuth: async () => ({ id: 7, role: 'user' })
  });
  assert.equal(result.status, 503);
  assert.equal(db.calls.run, 0, 'disabled rewards must not write a redemption');

  db = makeDb();
  result = await handleClubApi({
    request: req('/admin/rewards', 'POST', {}),
    url: urlFor('/admin/rewards'), DB: db, json: responseJson,
    checkAuth: async () => ({ id: 7, role: 'user' })
  });
  assert.equal(result.status, 403, 'non-admin cannot create rewards');
}

function redemptionSqlTest() {
  const py = `import sqlite3,sys
c=sqlite3.connect(":memory:")
c.execute("PRAGMA foreign_keys=ON")
c.executescript("CREATE TABLE users(id INTEGER PRIMARY KEY, username TEXT); CREATE TABLE podcasts(id INTEGER PRIMARY KEY); CREATE TABLE user_sessions(id INTEGER PRIMARY KEY, user_id INTEGER); CREATE TABLE admin_sessions(id INTEGER PRIMARY KEY, user_id INTEGER);")
c.executescript(sys.stdin.read())
c.execute("INSERT INTO users(id,username) VALUES(7,'fixture-listener')")
c.execute("UPDATE club_settings SET setting_value='true' WHERE setting_key IN ('club_enabled','rewards_enabled')")
c.execute("INSERT INTO club_point_ledger(user_id,delta,source_type,idempotency_key) VALUES(7,20,'fixture','fixture-credit')")
c.execute("INSERT INTO club_rewards(id,title_fa,reward_type,cost_points,stock_remaining,max_per_user,is_active) VALUES('r1','پاداش آزمایشی','coupon',10,3,3,1)")
c.execute("INSERT INTO club_reward_redemptions(id,user_id,reward_id,cost_points,idempotency_key,status) VALUES('red1',7,'r1',10,'idem-red-1','pending')")
assert c.execute("SELECT SUM(delta) FROM club_point_ledger WHERE user_id=7 AND status='posted'").fetchone()[0] == 10
assert c.execute("SELECT stock_remaining FROM club_rewards WHERE id='r1'").fetchone()[0] == 2
try:
 c.execute("INSERT INTO club_reward_redemptions(id,user_id,reward_id,cost_points,idempotency_key,status) VALUES('red2',7,'r1',10,'idem-red-1','pending')")
 raise AssertionError("duplicate idempotency key accepted")
except sqlite3.IntegrityError:
 pass
assert c.execute("SELECT SUM(delta) FROM club_point_ledger WHERE user_id=7 AND status='posted'").fetchone()[0] == 10
assert c.execute("SELECT stock_remaining FROM club_rewards WHERE id='r1'").fetchone()[0] == 2
c.execute("INSERT INTO club_rewards(id,title_fa,reward_type,cost_points,stock_remaining,is_active) VALUES('r2','گران','coupon',15,5,1)")
try:
 c.execute("INSERT INTO club_reward_redemptions(id,user_id,reward_id,cost_points,idempotency_key,status) VALUES('red3',7,'r2',15,'idem-red-3','pending')")
 raise AssertionError("insufficient balance accepted")
except sqlite3.IntegrityError as e:
 assert "club_insufficient_points" in str(e)
assert c.execute("SELECT stock_remaining FROM club_rewards WHERE id='r2'").fetchone()[0] == 5
c.execute("UPDATE club_settings SET setting_value='false' WHERE setting_key='rewards_enabled'")
try:
 c.execute("INSERT INTO club_reward_redemptions(id,user_id,reward_id,cost_points,idempotency_key,status) VALUES('red4',7,'r1',10,'idem-red-4','pending')")
 raise AssertionError("disabled rewards accepted")
except sqlite3.IntegrityError as e:
 assert "club_rewards_disabled" in str(e)
assert c.execute("SELECT SUM(delta) FROM club_point_ledger WHERE user_id=7 AND status='posted'").fetchone()[0] == 10
print("ATOMIC_REDEMPTION_OK")`;
  const output = execFileSync('python3', ['-c', py], { input: migrations, encoding: 'utf8' });
  assert.match(output, /ATOMIC_REDEMPTION_OK/);
}

check('club API module is syntax-valid and uses existing auth resolver', function () {
  assert.match(source, /export async function handleClubApi/);
  assert.match(source, /await checkAuth\(\)/);
  assert.match(source, /club_sequence_replay/);
  assert.match(source, /DB\.batch\(statements\)/);
  assert.match(source, /club-redeem:/);
});
check('D1 trigger redemption is atomic, idempotent, balance-checked, and disabled by default', redemptionSqlTest);

check('fresh-podcast missions reject replaying the same podcast within their cadence', function () {
  const missionSql = source.slice(source.indexOf("INSERT INTO club_user_missions"));
  assert.match(missionSql, /m\.event_type <> 'podcast_play' OR NOT EXISTS/);
  assert.match(missionSql, /prior\.user_id=\? AND prior\.podcast_id=\?/);
  assert.match(missionSql, /prior\.id<>\?/);
  assert.match(missionSql, /m\.cadence='daily' AND date\(prior\.received_at\)=date\('now'\)/);
  assert.match(missionSql, /m\.cadence='weekly'/);
  assert.match(missionSql, /m\.cadence='once'/);
  assert.match(missionSql, /m\.cadence='event'/);
  assert.match(source, /sequence, auth\.userId, podcastId, id\)\);/);
});


apiTests().then(() => {
  console.log('PASS | API route auth, summary, sequence replay, disabled rewards, admin authorization');
}).catch(error => {
  console.error('FAIL | API route integration | ' + error.stack);
  process.exitCode = 1;
});
