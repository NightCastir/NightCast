const fs = require('node:fs');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const base = fs.readFileSync('tests/fixtures/club-d1-base.sql', 'utf8');
const migrations = ['0001_club_foundation.sql','0002_listening_sequence_guard.sql','0003_atomic_reward_redemption.sql','0004_daily_engagement_quiz_referrals_notifications.sql']
  .map(name => fs.readFileSync('migrations/club/' + name, 'utf8')).join('\n');
const py = String.raw`
import sqlite3, sys, tempfile, os
from concurrent.futures import ThreadPoolExecutor
dbfile = tempfile.mktemp(prefix="nightcast-club-race-", suffix=".sqlite")
schema = sys.stdin.read()
conn = sqlite3.connect(dbfile, timeout=20)
conn.execute("PRAGMA foreign_keys=ON")
conn.executescript(schema)
conn.execute("UPDATE club_settings SET setting_value='true' WHERE setting_key IN ('club_enabled','earning_enabled','rewards_enabled')")
conn.execute("UPDATE club_settings SET setting_value='100' WHERE setting_key='daily_points_cap'")
conn.execute("UPDATE club_settings SET setting_value='250' WHERE setting_key='daily_xp_cap'")
conn.commit()
conn.close()

def connect():
    c = sqlite3.connect(dbfile, timeout=20)
    c.execute("PRAGMA foreign_keys=ON")
    c.execute("PRAGMA busy_timeout=20000")
    return c

def point_attempt(i):
    c=connect()
    try:
        c.execute("BEGIN IMMEDIATE")
        c.execute("""INSERT OR IGNORE INTO club_point_ledger(user_id,delta,source_type,idempotency_key,status)
          SELECT 101,1,'race-point',?,'posted'
          WHERE (SELECT COALESCE(SUM(delta),0) FROM club_point_ledger
            WHERE user_id=101 AND status='posted' AND delta>0 AND date(created_at)=date('now'))
            < CAST((SELECT setting_value FROM club_settings WHERE setting_key='daily_points_cap') AS INTEGER)""",(f'race-point-{i}',))
        c.commit()
    finally: c.close()

def xp_attempt(i):
    c=connect()
    try:
        c.execute("BEGIN IMMEDIATE")
        c.execute("""INSERT OR IGNORE INTO club_experience_ledger(user_id,delta,source_type,idempotency_key,status)
          SELECT 101,MIN(2,MAX(0,CAST((SELECT setting_value FROM club_settings WHERE setting_key='daily_xp_cap') AS INTEGER) -
            (SELECT COALESCE(SUM(delta),0) FROM club_experience_ledger
             WHERE user_id=101 AND status='posted' AND delta>0 AND date(created_at)=date('now')))),
            'race-xp',?,'posted'
          WHERE (SELECT COALESCE(SUM(delta),0) FROM club_experience_ledger
            WHERE user_id=101 AND status='posted' AND delta>0 AND date(created_at)=date('now'))
            < CAST((SELECT setting_value FROM club_settings WHERE setting_key='daily_xp_cap') AS INTEGER)""",(f'race-xp-{i}',))
        c.commit()
    finally: c.close()

with ThreadPoolExecutor(max_workers=20) as pool:
    list(pool.map(point_attempt, range(160)))
c=connect()
points=c.execute("SELECT COALESCE(SUM(delta),0) FROM club_point_ledger WHERE user_id=101 AND source_type='race-point' AND status='posted'").fetchone()[0]
assert points == 100, f"daily points cap exceeded or under-awarded under race: {points}"
c.close()

with ThreadPoolExecutor(max_workers=20) as pool:
    list(pool.map(xp_attempt, range(200)))
c=connect()
xp=c.execute("SELECT COALESCE(SUM(delta),0) FROM club_experience_ledger WHERE user_id=101 AND source_type='race-xp' AND status='posted'").fetchone()[0]
assert xp == 250, f"daily XP cap exceeded or under-awarded under race: {xp}"

c.execute("INSERT INTO club_rewards(id,title_fa,reward_type,cost_points,stock_remaining,max_per_user,is_active) VALUES('race-stock','Race stock','coupon',10,1,5,1)")
c.commit()
c.close()

def redeem_attempt(i):
    c=connect()
    try:
        c.execute("BEGIN IMMEDIATE")
        c.execute("""INSERT INTO club_reward_redemptions(id,user_id,reward_id,cost_points,idempotency_key,status)
          VALUES(?,101,'race-stock',10,?,'pending')""",(f'race-redemption-{i}',f'race-redemption-idem-{i}'))
        c.commit()
        return True
    except sqlite3.IntegrityError:
        c.rollback()
        return False
    finally: c.close()
with ThreadPoolExecutor(max_workers=2) as pool:
    results=list(pool.map(redeem_attempt, range(2)))
assert sum(results) == 1, f"stock race accepted {sum(results)} redemptions for one item"
c=connect()
stock=c.execute("SELECT stock_remaining FROM club_rewards WHERE id='race-stock'").fetchone()[0]
debits=c.execute("SELECT COUNT(*) FROM club_point_ledger WHERE source_type='reward_redemption' AND source_id IN ('race-redemption-0','race-redemption-1')").fetchone()[0]
assert stock == 0 and debits == 1, f"stock/debit not atomic: stock={stock}, debits={debits}"
print("CONCURRENT_DAILY_CAPS_OK points=100 xp=250")
print("CONCURRENT_REDEMPTION_OK accepted=1 stock=0 debits=1")
c.close()
os.remove(dbfile)
`;
const output = execFileSync('python3', ['-c', py], { input: base + '\n' + migrations, encoding: 'utf8' });
assert.match(output, /CONCURRENT_DAILY_CAPS_OK points=100 xp=250/);
assert.match(output, /CONCURRENT_REDEMPTION_OK accepted=1 stock=0 debits=1/);
console.log(output.trim());
