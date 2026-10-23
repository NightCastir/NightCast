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
  var lastRewardToastSession = '';

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
      return response.json().catch(function () { return {}; }).then(function (data) {
        /* UI feedback is shown only when the API confirms an accepted event and a posted reward. */
        if (response.ok && data && data.success && data.event && data.event.status === 'accepted') {
          if (data.points_awarded || data.xp_awarded) {
            if (data.points_awarded) {
              try { window.dispatchEvent(new CustomEvent('nightcast:clubpointschange')); } catch (_) {}
            }
            if (lastRewardToastSession !== sessionId) {
              lastRewardToastSession = sessionId;
              var message = data.points_awarded
                ? '🌟 شنیدن معتبر ثبت شد و امتیاز باشگاه به‌روزرسانی شد.'
                : '🎧 شنیدن معتبر ثبت شد و تجربه شنیداری به‌روزرسانی شد.';
              var bridge = window.NightCastPodcastBridge;
              if (bridge && typeof bridge.toast === 'function') bridge.toast(message);
              else {
                var node = document.getElementById('nc-listen-reward-status');
                if (!node) {
                  node = document.createElement('div');
                  node.id = 'nc-listen-reward-status';
                  node.className = 'nc-engagement-status';
                  node.setAttribute('role', 'status');
                  node.setAttribute('aria-live', 'polite');
                  document.body.appendChild(node);
                }
                node.textContent = message;
                node.classList.add('is-visible');
                window.setTimeout(function () { node.classList.remove('is-visible'); }, 4200);
              }
            }
          }
        }
      });
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
