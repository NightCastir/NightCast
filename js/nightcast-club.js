/* NightCast Club dashboard client. No client-side points, XP, missions or rewards are fabricated. */
(function () {
  'use strict';
  var API_BASE = 'https://nightcast-shield.tomasgermany2580.workers.dev/api/v1';
  var TOKEN_KEY = 'NightCastToken';
  var STATUS_ID = 'clubConnectionStatus';

  function byId(id) { return document.getElementById(id); }
  function setText(id, value) { var node = byId(id); if (node) node.textContent = value == null ? '—' : String(value); }
  function status(message, isError) {
    var node = byId(STATUS_ID);
    if (!node) return;
    node.textContent = message;
    node.className = 'nc-club-status' + (isError ? ' is-error' : '');
  }
  function safeToken() {
    try { return window.localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function request(path) {
    var token = safeToken();
    return fetch(API_BASE + path, {
      method: 'GET',
      headers: token ? { 'Accept': 'application/json', 'Authorization': 'Bearer ' + token } : { 'Accept': 'application/json' },
      credentials: 'omit',
      cache: 'no-store'
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (body) {
        if (!response.ok) {
          var error = new Error(body.message || ('HTTP ' + response.status));
          error.status = response.status;
          throw error;
        }
        return body;
      });
    });
  }
  function showUnavailable(message) {
    status(message, true);
    var containers = ['clubMissions', 'clubRecentBadges', 'clubLedger'];
    containers.forEach(function (id) {
      var node = byId(id);
      if (!node) return;
      while (node.firstChild) node.removeChild(node.firstChild);
      var p = document.createElement('p');
      p.className = 'nc-club-empty';
      p.textContent = 'اطلاعات واقعی این بخش هنوز از API باشگاه دریافت نشده است؛ هیچ امتیاز یا دستاورد آزمایشی نمایش داده نمی‌شود.';
      node.appendChild(p);
    });
  }
  function applySummary(data) {
    var summary = data && (data.summary || data.data || data);
    if (!summary || typeof summary !== 'object') throw new Error('پاسخ خلاصه باشگاه معتبر نیست.');
    setText('clubPoints', summary.clubPoints != null ? summary.clubPoints : summary.points);
    setText('clubXp', summary.xp);
    setText('clubPodcasts', summary.completedPodcasts);
    setText('clubBadges', summary.badgeCount);
    setText('clubLevelTitle', summary.levelTitle || 'سطح در دسترس نیست');
    setText('clubLevelNumber', summary.level != null ? ('سطح ' + summary.level) : '—');
    var percent = Number(summary.levelProgressPercent);
    if (!isFinite(percent)) percent = 0;
    percent = Math.max(0, Math.min(100, percent));
    var bar = byId('clubLevelProgressFill');
    var track = byId('clubLevelProgress');
    if (bar) bar.style.width = percent + '%';
    if (track) track.setAttribute('aria-valuenow', String(Math.round(percent)));
    setText('clubLevelHint', summary.xpToNextLevel != null ? ('فقط ' + summary.xpToNextLevel + ' XP تا سطح بعدی باقی مانده است.') : 'پیشرفت بر اساس XP معتبر سمت سرور محاسبه می‌شود.');
    status('حساب متصل است؛ خلاصه باشگاه از سرور دریافت شد.', false);
  }
  function start() {
    var themeButton = byId('clubThemeButton');
    if (themeButton) themeButton.addEventListener('click', function () {
      var choices = document.querySelectorAll('[data-theme-choice]');
      if (choices.length) {
        var first = choices[0];
        if (first && first.focus) first.focus();
      } else {
        status('برای تغییر تم، از انتخاب‌گر تم اصلی NightCast استفاده کن.', false);
      }
    });
    if (!safeToken()) {
      status('برای مشاهده پیشرفت شخصی، ابتدا با حساب NightCast وارد شو.', true);
      var login = document.createElement('a');
      login.href = '/login';
      login.className = 'nc-club-theme-button';
      login.textContent = 'ورود با Google';
      login.style.marginTop = '10px';
      var hero = document.querySelector('.nc-club-hero-copy');
      if (hero) hero.appendChild(login);
      return;
    }
    request('/club/summary').then(function (data) {
      applySummary(data);
    }).catch(function (error) {
      if (error.status === 401 || error.status === 403) {
        showUnavailable('نشست ورود معتبر نیست؛ دوباره وارد حساب NightCast شو.');
      } else if (error.status === 404) {
        showUnavailable('API باشگاه هنوز در Worker مستقر نشده است. تا تکمیل سمت سرور، هیچ امتیازی اعطا یا شبیه‌سازی نمی‌شود.');
      } else {
        showUnavailable('دریافت اطلاعات باشگاه ممکن نشد. اتصال را بررسی کن و بعداً دوباره تلاش کن.');
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());