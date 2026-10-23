const fs = require('node:fs');
const assert = require('node:assert/strict');

const api = fs.readFileSync('workers/club-api.js', 'utf8');
const club = fs.readFileSync('js/nightcast-club.js', 'utf8');
const listener = fs.readFileSync('js/nightcast-club-listener.js', 'utf8');
const engagement = fs.readFileSync('js/nightcast-club-engagement.js', 'utf8');
const sharing = fs.readFileSync('js/nightcast-sharing.js', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const page = fs.readFileSync('club.html', 'utf8');

function check(name, fn) {
  try { fn(); console.log('PASS | ' + name); }
  catch (error) { console.error('FAIL | ' + name + ' | ' + error.message); process.exitCode = 1; }
}

check('summary returns a server-computed count of distinct podcasts with accepted 60-second listening', function () {
  assert.match(api, /completedPodcastCount/);
  assert.match(api, /COUNT\(DISTINCT podcast_id\).*status='accepted'.*accepted_seconds>=60/s);
  assert.match(api, /completed_podcasts: Number\(completedPodcastCount\?\.total \|\| 0\)/);
});
check('club dashboard displays completed podcasts instead of active mission count', function () {
  assert.match(club, /setText\('clubPodcasts', summary\.completed_podcasts\)/);
  assert.doesNotMatch(club, /setText\('clubPodcasts', summary\.active_missions\)/);
  assert.match(page, /پادکست‌های تکمیل‌شده/);
});
check('listening feedback is gated on successful server response and accepted event', function () {
  assert.match(listener, /response\.ok && data && data\.success && data\.event && data\.event\.status === 'accepted'/);
  assert.match(listener, /nightcast:clubpointschange/);
  assert.match(listener, /شنیدن معتبر ثبت شد/);
  assert.match(listener, /lastRewardToastSession/);
});
check('daily visit reward refreshes the shared score chip only after positive server-confirmed award', function () {
  assert.match(engagement, /Number\(data\.points_awarded\) > 0[\s\S]{0,180}nightcast:clubpointschange/);
});
check('sharing already refreshes the score only after a positive API reward', function () {
  assert.match(sharing, /response\.ok && Number\(data\.points_awarded\) > 0/);
  assert.match(sharing, /nightcast:clubpointschange/);
});
check('live scripts have cache-busted versions on home and club pages', function () {
  assert.match(home, /nightcast-club-listener\.js\?v=2/);
  assert.match(home, /nightcast-club-engagement\.js\?v=2/);
  assert.match(page, /nightcast-club\.js\?v=11/);
  assert.match(page, /nightcast-club-engagement\.js\?v=2/);
});
