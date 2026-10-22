const assert = require('node:assert/strict');

const base = process.env.CLUB_TEST_BASE_URL || 'http://127.0.0.1:8799';
const member = { Authorization: 'Bearer club-test-user-token', 'Content-Type': 'application/json' };
const admin = { Authorization: 'Bearer club-test-admin-token', 'Content-Type': 'application/json' };

async function call(path, { method = 'GET', headers = {}, body } = {}) {
  const response = await fetch(base + '/api/v1/club' + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}
async function main() {
  let r = await call('/summary');
  assert.equal(r.status, 401, 'anonymous member route must be denied');
  r = await call('/summary', { headers: member });
  assert.equal(r.status, 200);
  assert.equal(r.data.enabled, true);
  assert.equal(r.data.points, 50);

  r = await call('/admin/overview', { headers: member });
  assert.equal(r.status, 403, 'member token must not access admin dashboard');
  r = await call('/admin/overview', { headers: admin });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.data.missions) && Array.isArray(r.data.rewards) && Array.isArray(r.data.redemptions));

  r = await call('/missions/fixture-claim-mission/claim', { method: 'POST', headers: member, body: {} });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.points_awarded, 10);
  assert.equal(r.data.xp_awarded, 5);
  r = await call('/missions/fixture-claim-mission/claim', { method: 'POST', headers: member, body: {} });
  assert.equal(r.status, 200);
  assert.equal(r.data.duplicate, true, 'mission claim retry must be idempotent');

  r = await call('/admin/missions', { method: 'POST', headers: admin, body: {
    title_fa: 'مأموریت یکپارچه', description_fa: 'integration mission', cadence: 'daily',
    event_type: 'listen', target_value: 2, reward_points: 3, reward_xp: 4
  }});
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const missionId = r.data.mission.id;
  r = await call('/admin/missions/' + missionId + '/activate', { method: 'POST', headers: admin, body: {} });
  assert.equal(r.status, 200);
  assert.equal(r.data.is_active, true);

  r = await call('/admin/rewards', { method: 'POST', headers: admin, body: {
    title_fa: 'پاداش یکپارچه', description_fa: 'integration reward', reward_type: 'coupon',
    cost_points: 5, stock_remaining: 4, max_per_user: 2
  }});
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const rewardId = r.data.reward.id;
  r = await call('/admin/rewards/' + rewardId + '/activate', { method: 'POST', headers: admin, body: {} });
  assert.equal(r.status, 200);
  assert.equal(r.data.is_active, true);

  r = await call('/admin/redemptions/fixture-cancel-redemption/cancel', { method: 'POST', headers: admin, body: {} });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.refunded_points, 10);
  r = await call('/admin/redemptions/fixture-cancel-redemption/cancel', { method: 'POST', headers: admin, body: {} });
  assert.equal(r.status, 200);
  assert.equal(r.data.duplicate, true, 'cancellation retry must not refund twice');

  r = await call('/admin/redemptions/fixture-fulfill-redemption/fulfill', { method: 'POST', headers: admin, body: { delivery_reference: 'TEST-DELIVERY-1' } });
  assert.equal(r.status, 200);
  assert.equal(r.data.status, 'fulfilled');
  r = await call('/admin/redemptions/fixture-fulfill-redemption/fulfill', { method: 'POST', headers: admin, body: { delivery_reference: 'TEST-DELIVERY-1' } });
  assert.equal(r.status, 200);
  assert.equal(r.data.duplicate, true, 'fulfillment retry must be idempotent');

  r = await call('/listen-events', { method: 'POST', headers: member, body: {
    event_id: 'club-test-event-0001', session_id: 'club-test-session-0001',
    sequence_number: 1, podcast_id: 501
  }});
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.event.status, 'received');
  r = await call('/listen-events', { method: 'POST', headers: member, body: {
    event_id: 'club-test-event-0001', session_id: 'club-test-session-0001',
    sequence_number: 1, podcast_id: 501
  }});
  assert.equal(r.status, 200);
  assert.equal(r.data.duplicate, true, 'event replay must not duplicate event or ledger');

  console.log('PASS | isolated Worker + local D1 auth, routes, mission claim, admin lifecycle, idempotency');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
