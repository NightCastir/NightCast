(function () {
  'use strict';
  var API = 'https://club-api.nightcast.ir/api/v1/club/quiz/today';
  var TOKEN_KEY = 'NightCastToken';
  var selectors = '.nc-quiz-notification';
  function token() { try { return window.localStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; } }
  function paint(node, answered, exhausted, unknown) {
    var disabled = !!answered || !!exhausted;
    node.classList.toggle('is-inactive', disabled);
    node.classList.toggle('is-active', !disabled);
    node.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    node.setAttribute('aria-label', answered ? 'سؤال روز؛ در ۲۴ ساعت اخیر پاسخ داده‌ای' : exhausted ? 'سؤال روز؛ پرسش تازه‌ای موجود نیست' : 'شرکت در سؤال روز');
    node.title = answered ? 'پاسخ سؤال روز را در ۲۴ ساعت اخیر ثبت کرده‌ای.' :
      exhausted ? 'همه پرسش‌های فعلی را پاسخ داده‌ای؛ پرسش تازه‌ای موجود نیست.' :
      unknown ? 'برای بررسی وضعیت سؤال روز، دوباره تلاش کن؛ با کلیک وارد صفحه سؤال می‌شوی.' :
      'سؤال روز آماده پاسخ‌گویی است؛ برای شرکت کلیک کن.';
    if (disabled) node.setAttribute('tabindex', '-1'); else node.removeAttribute('tabindex');
    var icon = node.querySelector('i');
    if (icon) icon.className = 'fa-solid fa-bell';
    var label = node.querySelector('.nc-quiz-notification-label');
    if (label) label.textContent = answered ? 'پاسخ ثبت شد' : exhausted ? 'پرسش تازه‌ای نیست' : 'سؤال روز';
  }
  function refresh(node) {
    if (!token()) { paint(node, false, false, false); return; }
    fetch(API, { method: 'GET', headers: { Accept: 'application/json', Authorization: 'Bearer ' + token() }, credentials: 'omit', cache: 'no-store' })
      .then(function (response) { return response.json().catch(function () { return {}; }).then(function (data) { return { ok: response.ok, data: data }; }); })
      .then(function (result) {
        if (!result.ok) { paint(node, false, false, true); return; }
        paint(node, !!(result.data.session && result.data.session.answered), !!result.data.exhausted, false);
      })
      .catch(function () { paint(node, false, false, true); });
  }
  function init() {
    var nodes = document.querySelectorAll(selectors);
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.getAttribute('data-nc-quiz-bound') === 'true') return;
      node.setAttribute('data-nc-quiz-bound', 'true');
      node.addEventListener('click', function (event) {
        if (node.getAttribute('aria-disabled') === 'true') { event.preventDefault(); event.stopPropagation(); }
      });
      paint(node, false, false, false);
      refresh(node);
      window.setInterval(function () { refresh(node); }, 5 * 60 * 1000);
    });
    window.addEventListener('storage', function (event) { if (event.key === TOKEN_KEY) Array.prototype.forEach.call(document.querySelectorAll(selectors), refresh); });
    window.addEventListener('nightcast:authchange', function () { Array.prototype.forEach.call(document.querySelectorAll(selectors), refresh); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());