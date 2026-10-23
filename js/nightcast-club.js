/* NightCast Club dashboard client. No client-side points, XP, missions or rewards are fabricated. */
(function () {
  'use strict';
  /* Dedicated production Club Worker; it validates the existing NightCast session token against the shared D1 database. */
  var API_BASE = 'https://club-api.nightcast.ir/api/v1';
  var TOKEN_KEY = 'NightCastToken';
  var STATUS_ID = 'clubConnectionStatus';
  var THEMES = ['midnight-cosmos', 'moonlight', 'aurora', 'studio-noir', 'deep-ocean', 'royal-gold', 'neon-city', 'persian-heritage'];
  var THEME_NAMES = ['کیهان نیمه‌شب', 'مهتاب', 'شفق قطبی', 'استودیوی سیاه', 'اقیانوس عمیق', 'طلایی سلطنتی', 'شهر نئون', 'میراث ایرانی'];
  var THEME_COLORS = ['#050816', '#F5F7FB', '#071410', '#101112', '#061826', '#0B0B0D', '#100817', '#101A32'];
  var clubFlags = { enabled: false, earning_enabled: false, rewards_enabled: false };

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
  function mutate(path, body) {
    var token = safeToken();
    if (!token) return Promise.reject(new Error('برای این عملیات باید وارد حساب شوید.'));
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      credentials: 'omit',
      cache: 'no-store',
      body: JSON.stringify(body || {})
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          var error = new Error(data.message || ('HTTP ' + response.status));
          error.status = response.status;
          error.code = data.code;
          throw error;
        }
        return data;
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
    clubFlags = {
      enabled: summary.enabled === true,
      earning_enabled: summary.earning_enabled === true,
      rewards_enabled: summary.rewards_enabled === true
    };
    if (!summary || typeof summary !== 'object') throw new Error('پاسخ خلاصه باشگاه معتبر نیست.');
    setText('clubPoints', summary.points);
    setText('clubXp', summary.xp);
    /* Count only distinct podcasts with at least one server-accepted 60-second listening interval. */
    setText('clubPodcasts', summary.completed_podcasts);
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
  function makeActionButton(label, disabled, onClick) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'nc-club-action-button';
    button.textContent = label;
    button.disabled = !!disabled;
    if (onClick) button.addEventListener('click', onClick);
    return button;
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
      var row = makeRow(mission.title_fa, detail, state);
      if (mission.user_status === 'completed') {
        row.appendChild(makeActionButton(clubFlags.earning_enabled ? 'دریافت پاداش' : 'دریافت پاداش غیرفعال', !clubFlags.earning_enabled, function () {
          mutate('/club/missions/' + encodeURIComponent(mission.id) + '/claim', {}).then(function () {
            status('پاداش مأموریت ثبت شد؛ در حال تازه‌سازی اطلاعات…', false);
            start();
          }).catch(function (error) { status(error.message || 'دریافت پاداش انجام نشد.', true); });
        }));
      }
      return row;
    }), 'در حال حاضر مأموریت فعالی برای این حساب وجود ندارد.');
  }
  function renderRewards(data) {
    var rows = (data && data.rewards) || [];
    clearAndAppend('clubRewards', rows.map(function (reward) {
      var stock = reward.stock_remaining === null || reward.stock_remaining === undefined ? 'موجودی محدود نشده' : 'موجودی: ' + Number(reward.stock_remaining);
      var detail = (reward.description_fa || '') + ' · هزینه: ' + Number(reward.cost_points || 0) + ' امتیاز · ' + stock;
      var row = makeRow(reward.title_fa, detail, reward.reward_type || 'پاداش');
      row.appendChild(makeActionButton(clubFlags.rewards_enabled ? 'دریافت پاداش' : 'به‌زودی فعال می‌شود', !clubFlags.rewards_enabled, function () {
        if (!window.confirm('برای ثبت درخواست این پاداش، امتیازها از موجودی شما کسر می‌شوند. ادامه می‌دهید؟')) return;
        mutate('/club/rewards/' + encodeURIComponent(reward.id) + '/redeem', { idempotency_key: createId() }).then(function () {
          status('درخواست دریافت پاداش ثبت شد؛ موجودی و تاریخچه در حال تازه‌سازی است.', false);
          start();
        }).catch(function (error) { status(error.message || 'ثبت درخواست پاداش انجام نشد.', true); });
      }));
      return row;
    }), 'فعلاً پاداش فعالی برای دریافت تعریف نشده است.');
  }
  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'nc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 14);
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
    clearAndAppend('clubRewards', [], 'برای بارگذاری پاداش‌ها اتصال معتبر به API لازم است.');
  }
  function loadSection(path, render, sectionName) {
    return request(path).then(function (data) {
      render(data);
      return true;
    }).catch(function (error) {
      var message = error.status === 404
        ? 'مسیر ' + sectionName + ' در Worker پاسخ نمی‌دهد.'
        : 'بارگذاری ' + sectionName + ' ناموفق بود.';
      var targetId = sectionName === 'مأموریت‌ها' ? 'clubMissions' : sectionName === 'نشان‌ها' ? 'clubRecentBadges' : sectionName === 'پاداش‌ها' ? 'clubRewards' : 'clubLedger';
      clearAndAppend(targetId, [], message);
      return false;
    });
  }
  function start() {
    var themeButton = byId('clubThemeButton');
    if (themeButton && themeButton.getAttribute('data-bound') !== 'true') {
      themeButton.addEventListener('click', cycleTheme);
      themeButton.setAttribute('data-bound', 'true');
    }
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
        loadSection('/club/rewards', renderRewards, 'پاداش‌ها'),
        loadSection('/club/ledger?limit=20', renderLedger, 'تاریخچه')
      ];
      return Promise.all(results);
    }).then(function (results) {
      if (results && results.every(function (ok) { return ok; })) {
        status('حساب متصل است؛ خلاصه، مأموریت‌ها، نشان‌ها، پاداش‌ها و تاریخچه از API دریافت شدند.', false);
      } else if (results) {
        status('خلاصه حساب دریافت شد، اما بارگذاری یک یا چند بخش کامل نشد.', true);
      }
    }).catch(function (error) {
      if (error.status === 401 || error.status === 403) {
        showUnavailable('نشست ورود معتبر نیست؛ دوباره وارد حساب NightCast شو.');
      } else if (error.status === 404) {
        showUnavailable('API باشگاه هنوز در Worker مستقر نشده است؛ مسیر خلاصه پاسخ نمی‌دهد و تا اتصال سمت سرور اطلاعات ساختگی نمایش داده نمی‌شود.');
      } else {
        showUnavailable('دریافت خلاصه باشگاه ممکن نشد. اتصال را بررسی کن و بعداً دوباره تلاش کن.');
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
