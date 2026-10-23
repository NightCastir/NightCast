const assert = require('node:assert/strict');
const questionBank = require('../data/club/daily-questions.json');

const base = process.env.CLUB_TEST_BASE_URL || 'http://127.0.0.1:8799';
const member = { Authorization: 'Bearer club-test-user-token', 'Content-Type': 'application/json' };
const admin = { Authorization: 'Bearer club-test-admin-token', 'Content-Type': 'application/json' };
const invitee = { Authorization: 'Bearer club-test-invitee-token', 'Content-Type': 'application/json' };

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
  assert.equal(r.data.points, 30, 'two seeded pending redemptions already debit ten points each');

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

  r = await call('/daily-visit', { method: 'POST', headers: member, body: {} });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.points_awarded, 2, 'daily visit should award 2 points: ' + JSON.stringify(r.data));
  r = await call('/daily-visit', { method: 'POST', headers: member, body: {} });
  assert.equal(r.status, 200);
  assert.equal(r.data.points_awarded, 0, 'daily visit reward must not be repeated');
  assert.equal(r.data.already_visited, true);

  r = await call('/quiz/today', { headers: member });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.question.options.length, 4);
  const bankQuestion = questionBank.questions.find(q => q.id === r.data.question.id);
  assert.ok(bankQuestion, 'assigned question must come from the committed JSON bank');
  r = await call('/quiz/answer', { method: 'POST', headers: member, body: { question_id: bankQuestion.id, selected_index: bankQuestion.correctIndex } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.correct, true);
  assert.equal(r.data.reward_points, 5);
  r = await call('/quiz/answer', { method: 'POST', headers: member, body: { question_id: bankQuestion.id, selected_index: (bankQuestion.correctIndex + 1) % 4 } });
  assert.equal(r.status, 200);
  assert.equal(r.data.duplicate, true, 'a submitted answer cannot be changed');

  r = await call('/referral', { headers: member });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.ok(r.data.code);
  const referralCode = r.data.code;
  r = await call('/referral/claim', { method: 'POST', headers: invitee, body: { code: referralCode } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.points_awarded, 20);
  r = await call('/referral/claim', { method: 'POST', headers: invitee, body: { code: referralCode } });
  assert.equal(r.status, 200);
  assert.equal(r.data.duplicate, true, 'invitee cannot claim a referral reward twice');

  r = await call('/notifications', { headers: member });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.ok((r.data.notifications || []).some(n => n.notification_type === 'referral_reward'),
    'online inviter should receive an in-app reward notification');
  r = await call('/leaderboard', { headers: member });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.ok(Array.isArray(r.data.leaderboard) && r.data.leaderboard.length >= 2);
  assert.ok(['🥇','🥈','🥉'].includes(r.data.leaderboard[0].medal), 'leaderboard assigns a medal to the top three');

  console.log('PASS | isolated D1 auth, missions, daily visits, immutable quiz, referrals, notifications, leaderboard and idempotency');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
