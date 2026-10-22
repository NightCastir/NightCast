/* NightCast Club dashboard client. Data is rendered only from authenticated API responses. */
(function () {
  'use strict';
  /* Keep this endpoint aligned with js/auth.js until the Worker custom-domain route is verified. */
  var API_BASE = 'https://nightcast-shield.tomasgermany2580.workers.dev/api/v1';
  var TOKEN_KEY = 'NightCastToken';
  var STATUS_ID = 'clubConnectionStatus';
  var THEMES = ['midnight-cosmos', 'moonlight', 'aurora', 'studio-noir', 'deep-ocean', 'royal-gold', 'neon-city', 'persian-heritage'];
  var THEME_NAMES = ['کیهان نیمه‌شب', 'مهتاب', 'شفق قطبی', 'استودیوی سیاه', 'اقیانوس عمیق', 'طلایی سلطنتی', 'شهر نئون', 'میراث ایرانی'];
  var THEME_COLORS = ['#050816', '#F5F7FB', '#071410', '#101112', '#061826', '#0B0B0D', '#100817', '#101A32'];

  function byId(id) { return document.getElementById(id); }
  function setText(id, value) {
    var node = byId(id);
    if (node) node.textContent = value === null || value === undefined || value === '' ? '—' : String(value);
  }
  function status(message, isError) {
    var node = byId(STATUS_ID);
    if (!node) return;
    node.textContent = message;
    node.className = 'nc-club-status' + (isError ? ' is-error' : '');
  }
  function safeToken() {
    try { return window.localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function cycleTheme() {
    var current = 'midnight-cosmos';
    try { current = window.localStorage.getItem('nightcast-theme') || current; } catch (e) {}
    var index = THEMES.indexOf(current);
    var nextIndex = (index + 1 + THEMES.length) % THEMES.length;
    var next = THEMES[nextIndex];
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.style.colorScheme = next === 'moonlight' ? 'light' : 'dark';
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute('content', THEME_COLORS[nextIndex]);
    try { window.localStorage.setItem('nightcast-theme', next); } catch (e) {}
    if (typeof window.CustomEvent === 'function') {
      document.dispatchEvent(new CustomEvent('nightcast:themechange', { detail: { id: next } }));
    }
    var button = byId('clubThemeButton');
    if (button) button.setAttribute('aria-label', 'تم فعال: ' + THEME_NAMES[nextIndex] + '؛ برای تغییر، دوباره فشار بده');
    status('تم فعال: ' + THEME_NAMES[nextIndex], false);
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
  function clearAndAppend(id, nodes, emptyText) {
    var target = byId(id);
    if (!target) return;
    while (target.firstChild) target.removeChild(target.firstChild);
    if (!nodes.length) {
      var empty = document.createElement('p');
      empty.className = 'nc-club-empty';
      empty.textContent = emptyText;
      target.appendChild(empty);
      return;
    }
    nodes.forEach(function (node) { target.appendChild(node); });
  }
  function makeRow(title, detail, badgeText) {
    var row = document.createElement('article');
    row.className = 'nc-club-data-row';
    var main = document.createElement('div');
    main.className = 'nc-club-data-main';
    var heading = document.createElement('h3');
    heading.className = 'nc-club-data-title';
    heading.textContent = title || 'بدون عنوان';
    var description = document.createElement('p');
    description.className = 'nc-club-data-detail';
    description.textContent = detail || '';
    main.appendChild(heading);
    main.appendChild(description);
    row.appendChild(main);
    if (badgeText) {
      var badge = document.createElement('span');
      badge.className = 'nc-club-data-badge';
      badge.textContent = badgeText;
      row.appendChild(badge);
    }
    return row;
  }
  function formatDate(value) {
    if (!value) return '';
    var date = new Date(String(value).replace(' ', 'T') + (String(value).indexOf('Z') >= 0 ? '' : 'Z'));
    if (!isFinite(date.getTime())) return String(value);
    try { return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(date); }
    catch (e) { return date.toLocaleString(); }
  }
  function applySummary(data) {
    var summary = data && (data.summary || data.data || data);
    if (!summary || typeof summary !== 'object') throw new Error('پاسخ خلاصه باشگاه معتبر نیست.');
    setText('clubPoints', summary.points);
    setText('clubXp', summary.xp);
    /* API currently exposes active mission count, not completed-podcast count. Do not invent a metric. */
    setText('clubPodcasts', summary.active_missions);
    var podcastLabel = byId('clubPodcasts');
    if (podcastLabel && podcastLabel.parentNode) {
      var small = podcastLabel.parentNode.querySelector('small');
      var hint = podcastLabel.parentNode.querySelector('span');
      if (small) small.textContent = 'مأموریت‌های فعال';
      if (hint) hint.textContent = 'قابل انجام';
    }
    setText('clubBadges', summary.badges_earned);
    var level = summary.level && typeof summary.level === 'object' ? summary.level : null;
    var nextLevel = summary.next_level && typeof summary.next_level === 'object' ? summary.next_level : null;
    setText('clubLevelTitle', level ? level.title_fa : 'سطح هنوز تعریف نشده');
    setText('clubLevelNumber', level && level.level != null ? ('سطح ' + level.level) : '—');
    var xp = Number(summary.xp || 0);
    var currentMin = level ? Number(level.min_xp || 0) : 0;
    var nextMin = nextLevel ? Number(nextLevel.min_xp || 0) : currentMin;
    var percent = nextLevel && nextMin > currentMin ? ((xp - currentMin) / (nextMin - currentMin)) * 100 : (level ? 100 : 0);
    if (!isFinite(percent)) percent = 0;
    percent = Math.max(0, Math.min(100, percent));
    var bar = byId('clubLevelProgressFill');
    var track = byId('clubLevelProgress');
    if (bar) bar.style.width = percent + '%';
    if (track) track.setAttribute('aria-valuenow', String(Math.round(percent)));
    setText('clubLevelHint', nextLevel
      ? ('تا سطح «' + nextLevel.title_fa + '»، ' + Math.max(0, nextMin - xp) + ' XP باقی مانده است.')
      : (level ? 'به بالاترین سطح تعریف‌شده رسیده‌ای.' : 'سطح‌ها هنوز در سامانه تعریف نشده‌اند.'));
  }
  function renderMissions(data) {
    var rows = (data && data.missions) || [];
    clearAndAppend('clubMissions', rows.map(function (mission) {
      var progress = Number(mission.progress_value || 0);
      var target = Number(mission.target_value || 0);
      var detail = (mission.description_fa ? mission.description_fa + ' · ' : '') +
        'پیشرفت: ' + progress + ' از ' + target +
        ' · پاداش: ' + Number(mission.reward_points || 0) + ' امتیاز / ' + Number(mission.reward_xp || 0) + ' XP';
      var state = mission.user_status === 'claimed' ? 'دریافت شده' :
        mission.user_status === 'completed' ? 'آماده دریافت' : 'در حال انجام';
      return makeRow(mission.title_fa, detail, state);
    }), 'در حال حاضر مأموریت فعالی برای این حساب وجود ندارد.');
  }
  function renderBadges(data) {
    var rows = (data && data.badges) || [];
    var earned = rows.filter(function (badge) { return !!badge.earned_at; });
    clearAndAppend('clubRecentBadges', earned.map(function (badge) {
      return makeRow(badge.title_fa, badge.description_fa || 'دستاورد ثبت‌شده در حساب NightCast', formatDate(badge.earned_at));
    }), 'هنوز نشانی برای این حساب ثبت نشده است. با شنیدن معتبر و انجام مأموریت‌ها دستاوردها اینجا ظاهر می‌شوند.');
  }
  function renderLedger(data) {
    var points = (data && data.points) || [];
    var xp = (data && data.experience) || [];
    var rows = [];
    points.forEach(function (entry) {
      rows.push({ date: entry.created_at || '', id: Number(entry.id || 0), node: makeRow(
        'امتیاز باشگاه', (Number(entry.delta) > 0 ? '+' : '') + Number(entry.delta) + ' امتیاز · ' + (entry.source_type || 'تراکنش') + ' · ' + formatDate(entry.created_at),
        entry.status === 'posted' ? 'ثبت‌شده' : (entry.status || 'نامشخص')) });
    });
    xp.forEach(function (entry) {
      rows.push({ date: entry.created_at || '', id: Number(entry.id || 0), node: makeRow(
        'تجربه شنیداری (XP)', (Number(entry.delta) > 0 ? '+' : '') + Number(entry.delta) + ' XP · ' + (entry.source_type || 'تراکنش') + ' · ' + formatDate(entry.created_at),
        entry.status === 'posted' ? 'ثبت‌شده' : (entry.status || 'نامشخص')) });
    });
    rows.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)) || b.id - a.id; });
    clearAndAppend('clubLedger', rows.slice(0, 20).map(function (entry) { return entry.node; }),
      'هنوز تراکنشی در دفتر امتیاز و تجربه این حساب ثبت نشده است.');
  }
  function showUnavailable(message) {
    status(message, true);
    clearAndAppend('clubMissions', [], 'برای بارگذاری مأموریت‌ها اتصال معتبر به API لازم است.');
    clearAndAppend('clubRecentBadges', [], 'برای بارگذاری دستاوردها اتصال معتبر به API لازم است.');
    clearAndAppend('clubLedger', [], 'برای بارگذاری تاریخچه اتصال معتبر به API لازم است.');
  }
  function loadSection(path, render, sectionName) {
    return request(path).then(function (data) {
      render(data);
      return true;
    }).catch(function (error) {
      var message = error.status === 404
        ? 'مسیر ' + sectionName + ' در Worker پاسخ نمی‌دهد.'
        : 'بارگذاری ' + sectionName + ' ناموفق بود.';
      clearAndAppend(sectionName === 'مأموریت‌ها' ? 'clubMissions' : sectionName === 'نشان‌ها' ? 'clubRecentBadges' : 'clubLedger', [], message);
      return false;
    });
  }
  function start() {
    var themeButton = byId('clubThemeButton');
    if (themeButton) themeButton.addEventListener('click', cycleTheme);
    if (!safeToken()) {
      status('برای مشاهده پیشرفت شخصی، ابتدا با حساب NightCast وارد شو.', true);
      var login = document.createElement('a');
      login.href = '/login';
      login.className = 'nc-club-theme-button';
      login.textContent = 'ورود با Google';
      login.style.marginTop = '10px';
      var hero = document.querySelector('.nc-club-hero-copy');
      if (hero && !byId('clubLoginLink')) {
        login.id = 'clubLoginLink';
        hero.appendChild(login);
      }
      return;
    }
    request('/club/summary').then(function (data) {
      applySummary(data);
      var results = [
        loadSection('/club/missions', renderMissions, 'مأموریت‌ها'),
        loadSection('/club/badges', renderBadges, 'نشان‌ها'),
        loadSection('/club/ledger?limit=20', renderLedger, 'تاریخچه')
      ];
      return Promise.all(results);
    }).then(function (results) {
      if (results && results.every(function (ok) { return ok; })) {
        status('حساب متصل است؛ خلاصه، مأموریت‌ها، نشان‌ها و تاریخچه از API دریافت شدند.', false);
      } else if (results) {
        status('خلاصه حساب دریافت شد، اما بارگذاری یک یا چند بخش کامل نشد.', true);
      }
    }).catch(function (error) {
      if (error.status === 401 || error.status === 403) {
        showUnavailable('نشست ورود معتبر نیست؛ دوباره وارد حساب NightCast شو.');
      } else if (error.status === 404) {
        showUnavailable('مسیر خلاصه باشگاه در Worker مستقر نیست؛ تا اتصال سمت سرور اطلاعات ساختگی نمایش داده نمی‌شود.');
      } else {
        showUnavailable('دریافت خلاصه باشگاه ممکن نشد. اتصال را بررسی کن و بعداً دوباره تلاش کن.');
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
