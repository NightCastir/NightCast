(function () {
  'use strict';
  var API = 'https://club-api.nightcast.ir/api/v1/club';
  var TOKEN_KEY = 'NightCastToken';
  var LAST_VISIT_KEY = 'nc-last-catalog-visit-v1';
  function token() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; } }
  function request(path, method, body) {
    var t = token();
    if (!t) return Promise.reject(new Error('login-required'));
    return fetch(API + path, { method: method || 'GET', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t }, credentials: 'omit', cache: 'no-store', body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) { if (!r.ok) throw new Error(data.message || ('HTTP ' + r.status)); return data; });
    });
  }
  function toast(text) {
    var bridge = window.NightCastPodcastBridge;
    if (bridge && bridge.toast) bridge.toast(text);
    else {
      var el = document.getElementById('nc-engagement-status');
      if (!el) { el = document.createElement('div'); el.id = 'nc-engagement-status'; el.className = 'nc-engagement-status'; el.setAttribute('role','status'); document.body.appendChild(el); }
      el.textContent = text; el.classList.add('is-visible');
      window.setTimeout(function () { el.classList.remove('is-visible'); }, 4200);
    }
  }
  function showNotification(title, body, url) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(function (reg) {
        if (reg.showNotification) return reg.showNotification(title, { body: body, icon: '/assets/icons/icon-512.png', badge: '/assets/icons/icon-512.png', data: { url: url || '/' }, tag: 'nightcast-' + title });
      }).catch(function () {});
    } else {
      try { new Notification(title, { body: body, icon: '/assets/icons/icon-512.png' }); } catch (_) {}
    }
  }
  function notifyNewPodcasts() {
    var bridge = window.NightCastPodcastBridge;
    if (!bridge || !bridge.getPodcasts) return;
    var now = Date.now(), last = 0;
    try { last = Number(localStorage.getItem(LAST_VISIT_KEY) || 0); } catch (_) {}
    var podcasts = bridge.getPodcasts() || [];
    if (last > 0) {
      var fresh = podcasts.filter(function (p) {
        var date = Date.parse(p.publish_date || p.published_at || p.created_at || '');
        return isFinite(date) && date > last;
      });
      if (fresh.length) {
        var newest = fresh[0];
        showNotification('پادکست تازه در NightCast 🎧', fresh.length === 1 ? 'اپیزود تازه «' + String(newest.title || newest.book_name || 'پادکست جدید') + '» منتشر شده است.' : fresh.length + ' پادکست تازه منتشر شده است.', '/?podcast=' + encodeURIComponent(newest.slug || newest.id || ''));
        toast(fresh.length === 1 ? 'از آخرین بازدیدت یک پادکست تازه منتشر شده است.' : fresh.length + ' پادکست تازه از آخرین بازدیدت منتشر شده‌اند.');
      }
    }
    try { localStorage.setItem(LAST_VISIT_KEY, String(now)); } catch (_) {}
  }
  function midnightCountdown() {
    if (document.getElementById('nc-quiz-reminder')) return;
    var host = document.createElement('aside');
    host.id = 'nc-quiz-reminder';
    host.className = 'nc-quiz-reminder';
    host.innerHTML = '<div><strong>🎁 فرصت شرکت در سؤال روز باقیست</strong><span id="nc-quiz-countdown">تا پایان امروز</span></div><a href="/quiz">پاسخ بده و جایزه بگیر</a><button type="button" aria-label="بستن یادآوری">×</button>';
    document.body.appendChild(host);
    var close = host.querySelector('button');
    close.addEventListener('click', function () { host.remove(); });
    function tick() {
      var now = new Date();
      var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      var left = Math.max(0, midnight.getTime() - now.getTime());
      var h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000), s = Math.floor((left % 60000) / 1000);
      var el = document.getElementById('nc-quiz-countdown');
      if (el) el.textContent = 'فرصت باقی‌مانده: ' + String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    }
    tick(); window.setInterval(tick, 1000);
  }
  function urlBase64ToUint8Array(value) {
    var padding = '='.repeat((4 - value.length % 4) % 4);
    var base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw = window.atob(base64), output = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
    return output;
  }
  function start() {
    var params = new URLSearchParams(window.location.search);
    var ref = params.get('ref');
    if (ref) {
      try { localStorage.setItem('nc-pending-referral-code', ref); } catch (_) {}
      params.delete('ref');
      var clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
      history.replaceState({}, '', clean);
    }
    if (!token()) return;
    request('/daily-visit','POST',{}).then(function (data) {
      if (Number(data.points_awarded) > 0) toast('🌟 به خاطر بازدید امروز، ' + data.points_awarded + ' امتیاز گرفتی!');
      var fresh = Array.isArray(data.new_podcasts) ? data.new_podcasts : [];
      if (fresh.length) {
        var newest = fresh[0];
        showNotification('پادکست تازه در NightCast 🎧',
          fresh.length === 1 ? 'اپیزود تازه «' + String(newest.title || 'پادکست جدید') + '» از آخرین بازدیدت منتشر شده است.' : fresh.length + ' پادکست تازه از آخرین بازدیدت منتشر شده‌اند.',
          '/?podcast=' + encodeURIComponent(newest.slug || newest.id || ''));
        toast(fresh.length === 1 ? '🎧 از آخرین بازدیدت یک پادکست تازه منتشر شده است.' : '🎧 ' + fresh.length + ' پادکست تازه از آخرین بازدیدت منتشر شده‌اند.');
      }
    }).catch(function () {});
    var savedRef = '';
    try { savedRef = localStorage.getItem('nc-pending-referral-code') || ''; } catch (_) {}
    if (savedRef) request('/referral/claim','POST',{code:savedRef}).then(function (data) {
      if (data && !data.duplicate) toast('🎉 کد دعوت ثبت شد؛ به NightCast خوش آمدی!');
      try { localStorage.removeItem('nc-pending-referral-code'); } catch (_) {}
    }).catch(function () {});
    var seenNotifications = {};
    function pollNotifications() {
      request('/notifications').then(function (data) {
        (data.notifications || []).filter(function (item) { return !item.read_at && !seenNotifications[item.id]; }).forEach(function (item) {
          seenNotifications[item.id] = true;
          toast(item.notification_type === 'referral_reward' ? '🎉 ' + item.body : item.title + ': ' + item.body);
          request('/notifications/read','POST',{id:item.id}).catch(function () {});
        });
      }).catch(function () {});
    }
    pollNotifications();
    window.setInterval(pollNotifications, 20000);
    request('/quiz/status').then(function (data) {
      if (data && data.needs_quiz && !window.location.pathname.startsWith('/quiz')) midnightCountdown();
    }).catch(function () {});
    var button = document.getElementById('ncEnableNotifications');
    if (button) button.addEventListener('click', async function () {
      if (!('Notification' in window) || !navigator.serviceWorker || !window.PushManager) {
        toast('اعلان‌های وب در این دستگاه پشتیبانی نمی‌شوند؛ در تنظیمات اپلیکیشن بررسی کن.');
        return;
      }
      try {
        var permission = await Notification.requestPermission();
        if (permission !== 'granted') { toast('اجازه اعلان‌ها داده نشد.'); return; }
        var keyInfo = await request('/notifications/vapid-public-key');
        if (!keyInfo.configured || !keyInfo.public_key) { toast('اعلان پس‌زمینه هنوز پیکربندی نشده است؛ کلید عمومی VAPID در Worker موجود نیست.'); return; }
        var reg = await navigator.serviceWorker.ready;
        var sub = await reg.pushManager.getSubscription();
        if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyInfo.public_key) });
        await request('/notifications/subscribe','POST',{subscription:sub.toJSON(),timezone:(Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Tehran')});
        toast('اشتراک اعلان این دستگاه ثبت شد.');
      } catch (_) { toast('فعال‌سازی اعلان‌ها انجام نشد؛ اتصال و مجوز اعلان را بررسی کن.'); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
}());