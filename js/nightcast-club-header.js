/* Authenticated Club score chip shared by the archive and Club page. */
(function () {
  'use strict';
  var API = 'https://club-api.nightcast.ir/api/v1/club/summary';
  var TOKEN_KEY = 'NightCastToken';
  var lastToken = '';
  var busy = false;
  function readToken() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; } }
  function render(points, visible) {
    var chip = document.getElementById('ncHeaderClubScore');
    var value = document.getElementById('ncHeaderClubPoints');
    if (!chip || !value) return;
    chip.hidden = !visible;
    if (visible) value.textContent = Number(points || 0).toLocaleString('fa-IR');
  }
  function refresh() {
    var token = readToken();
    if (!token) { lastToken = ''; render(0, false); return; }
    if (busy) return;
    busy = true;
    fetch(API, { headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + token }, credentials: 'omit', cache: 'no-store' })
      .then(function (response) { return response.json().catch(function () { return {}; }).then(function (data) { if (!response.ok) throw new Error('club-summary-unavailable'); return data; }); })
      .then(function (data) {
        var summary = data.summary || data.data || data;
        lastToken = token;
        render(summary.points, true);
      })
      .catch(function () { lastToken = token; render(0, false); })
      .finally(function () { busy = false; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh); else refresh();
  window.addEventListener('storage', function (event) { if (!event || event.key === TOKEN_KEY) refresh(); });
  window.addEventListener('nightcast:clubpointschange', refresh);
  window.setInterval(function () { if (readToken() !== lastToken) refresh(); }, 2500);
  window.setInterval(refresh, 30000);
}());
