const fs = require('node:fs');
const assert = require('node:assert/strict');
const api = fs.readFileSync('workers/club-api.js', 'utf8');
const html = fs.readFileSync('club-admin.html', 'utf8');
const ui = fs.readFileSync('js/club-admin.js', 'utf8');
const migration = fs.readFileSync('migrations/club/0003_atomic_reward_redemption.sql', 'utf8');

const checks = [
  ['mission progress persisted from validated listen events', /INSERT INTO club_user_missions/.test(api) && /club_user_missions\.progress_value \+ excluded\.progress_value/.test(api)],
  ['mission claim route is authenticated and checks completed target', /missionClaim/.test(api) && /club_mission_not_complete/.test(api) && /status='completed' AND progress_value>=\?/.test(api)],
  ['mission points and XP claims use independent idempotency keys', /club-mission-points:/.test(api) && /club-mission-xp:/.test(api) && /INSERT OR IGNORE INTO club_point_ledger/.test(api)],
  ['admin overview returns missions, rewards, redemptions, and settings', /\/admin\/overview/.test(api) && /redemptions: redemptions\.results/.test(api)],
  ['mission and reward activation are server-admin routes', /requireAdmin\(checkAuth\)/.test(api) && /missionState/.test(api) && /rewardState/.test(api)],
  ['fulfillment transitions only pending requests', /status='fulfilled'.*WHERE id=\? AND status='pending'/s.test(api)],
  ['cancellation refunds points idempotently and restores stock once', /club-reward-refund:' \|\| id/.test(api) && /NOT EXISTS\(SELECT 1 FROM club_point_ledger WHERE source_type='reward_refund'/.test(api)],
  ['database enforces redemption balance, stock, max-per-user and feature flags', /club_rewards_disabled/.test(migration) && /club_insufficient_points/.test(migration) && /club_reward_user_limit/.test(migration) && /stock_remaining/.test(migration)],
  ['admin page has mission, reward, and redemption controls', /id="mission-form"/.test(html) && /id="reward-form"/.test(html) && /id="redemptions"/.test(html)],
  ['admin UI reads current NightCast auth token and calls protected API', /NightCastToken/.test(ui) && /Authorization/.test(ui) && /\/admin\/overview/.test(ui)],
  ['admin UI renders server values as text rather than HTML', /textContent/.test(ui) && !/innerHTML\s*=/.test(ui)],
  ['admin UI never exposes a public feature-flag toggle', !/\/admin\/settings|setting_key\s*:\s*["']club_enabled/.test(ui)]
];
let failures = 0;
for (const [name, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name);
  if (!ok) failures++;
}
if (failures) process.exitCode = 1;
