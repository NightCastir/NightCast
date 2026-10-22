/* NightCast Club listening event bridge. The server, never this script, decides what earns points. */
(function () {
  'use strict';
  var API = 'https://club-api.nightcast.ir/api/v1/club/listen-events';
  var TOKEN_KEY = 'NightCastToken';
  var audio = null;
  var podcastId = 0;
  var timer = 0;
  var active = false;
  var disabledForSession = false;
  var sessionId = '';
  var sequence = 0;
  var pending = false;

  function token() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; }
  }
  function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'nc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 14);
  }
  function stopTimer() {
    if (timer) window.clearInterval(timer);
    timer = 0;
  }
  function sendEvent() {
    var auth = token();
    if (!active || disabledForSession || !auth || !podcastId || pending) return;
    pending = true;
    sequence += 1;
    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': 'Bearer ' + auth },
      credentials: 'omit',
      cache: 'no-store',
      body: JSON.stringify({
        event_id: randomId(),
        session_id: sessionId,
        sequence_number: sequence,
        podcast_id: podcastId
      })
    }).then(function (response) {
      if (response.status === 401 || response.status === 403 || response.status === 503) {
        disabledForSession = true;
        stopTimer();
      }
      return response.json().catch(function () { return {}; });
    }).catch(function () {
      /* Network failures never award anything client-side; a later playback can retry. */
    }).then(function () { pending = false; });
  }
  function finish() {
    if (!active) return;
    stopTimer();
    sendEvent();
    active = false;
  }
  function begin() {
    finish();
    if (!token() || !podcastId) return;
    disabledForSession = false;
    sessionId = randomId();
    sequence = 0;
    active = true;
    sendEvent();
    timer = window.setInterval(sendEvent, 65000);
  }
  function awardDailyCheckin() {
    var auth = token();
    if (!auth) return;
    fetch('https://club-api.nightcast.ir/api/v1/club/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': 'Bearer ' + auth },
      credentials: 'omit',
      cache: 'no-store',
      body: '{}'
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok || !data.success || data.duplicate || !Number(data.points_awarded)) return;
        var toast = document.createElement('div');
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.textContent = '✨ خوش آمدی! ' + Number(data.points_awarded) + ' امتیاز حضور روزانه به باشگاهت اضافه شد.';
        toast.style.cssText = 'position:fixed;z-index:2147483000;right:16px;bottom:calc(110px + env(safe-area-inset-bottom,0px));max-width:min(420px,calc(100vw - 32px));padding:14px 18px;border:1px solid rgba(116,220,180,.6);border-radius:16px;background:rgba(8,30,36,.96);color:#f2fff9;box-shadow:0 12px 40px #0006;font:600 14px/1.8 Vazirmatn,sans-serif;direction:rtl;opacity:0;transform:translateY(10px);transition:opacity .25s,transform .25s';
        document.body.appendChild(toast);
        window.requestAnimationFrame(function () { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });
        window.setTimeout(function () { toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)'; window.setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300); }, 5500);
        window.dispatchEvent(new CustomEvent('nightcast:club-points-awarded', { detail: { source: 'daily_checkin', points: Number(data.points_awarded) } }));
      });
    }).catch(function () { /* no client-side credit on API/network failure */ });
  }
  function init() {
    audio = document.getElementById('audioPlayer');
    if (!audio) return;
    window.addEventListener('nightcast:podcastchange', function (event) {
      finish();
      var nextId = Number(event && event.detail && event.detail.podcastId);
      podcastId = Number.isSafeInteger(nextId) && nextId > 0 ? nextId : 0;
      disabledForSession = false;
    });
    audio.addEventListener('play', begin);
    audio.addEventListener('pause', finish);
    audio.addEventListener('ended', finish);
    window.addEventListener('pagehide', finish);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
