const SITE = 'https://nightcast.ir';
const API = 'https://nightcast-shield.tomasgermany2580.workers.dev/api/v1';
const findings = [];
const checks = [];
const add = (name, ok, detail) => {
  checks.push({ name, ok: Boolean(ok), detail: String(detail || '') });
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''));
};
const warn = (name, detail) => {
  findings.push({ name, detail });
  console.log('WARN | ' + name + ' | ' + detail);
};
async function get(url) {
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
  return { response, body: await response.text() };
}
async function getPublishedHome() {
  return get(SITE + '/');
}
(async () => {
  const { response: homeResponse, body: html } = await getPublishedHome();
  add('Live homepage responds', homeResponse.ok, 'HTTP ' + homeResponse.status + ', final URL ' + homeResponse.url);
  if (!homeResponse.ok) throw new Error('Live homepage unavailable; cannot complete audit.');
  const refs = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)]
    .map(m => new URL(m[1], SITE).href).filter(u => new URL(u).origin === SITE);
  const inline = [...html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script\s*>/gi)]
    .map((m, i) => ({ label: 'index.html inline script #' + (i + 1), code: m[1] }));
  const uniqueRefs = [...new Set(refs)];
  const sources = [...inline];
  let assetFailures = 0;
  for (const url of uniqueRefs) {
    try {
      const { response, body } = await get(url);
      if (!response.ok) {
        assetFailures++;
        add('Referenced JavaScript responds', false, 'HTTP ' + response.status + ' ' + url);
      } else {
        add('Referenced JavaScript responds', true, 'HTTP ' + response.status + ' ' + new URL(url).pathname);
        sources.push({ label: new URL(url).pathname, code: body });
      }
    } catch (e) {
      assetFailures++;
      add('Referenced JavaScript responds', false, url + ': ' + e.message);
    }
  }
  const syntaxRules = [
    { name: 'Optional chaining (?.)', re: /\?\.(?![0-9])/g, note: 'Unsupported by older TV browser engines; a parse error can prevent an entire script from running.' },
    { name: 'Nullish coalescing (??)', re: /\?\?(?!=)/g, note: 'ES2020 syntax; older TV browser engines may fail to parse this script.' },
    { name: 'Array spread syntax', re: /\[[^\]\n]{0,180}\.\.\.[^\]\n]{0,180}\]/g, note: 'Requires a modern JavaScript parser; review against the TV browser version.' }
  ];
  for (const rule of syntaxRules) {
    const hits = [];
    for (const source of sources) {
      const lines = source.code.split('\n');
      lines.forEach((line, i) => {
        if (rule.re.test(line)) hits.push(source.label + ':' + (i + 1) + ' ' + line.trim().slice(0, 130));
        rule.re.lastIndex = 0;
      });
    }
    if (hits.length) warn(rule.name, hits.length + ' possible occurrence(s). ' + rule.note + ' Examples: ' + hits.slice(0, 8).join(' || '));
    else add('No ' + rule.name + ' detected in fetched scripts', true, 'scanned ' + sources.length + ' inline/external scripts');
  }
  for (const route of ['/about', '/contact']) {
    try {
      const { response, body } = await get(SITE + route);
      add('Clean route ' + route + ' resolves', response.ok && /<html/i.test(body), 'HTTP ' + response.status + ', final URL ' + response.url);
    } catch (e) {
      add('Clean route ' + route + ' resolves', false, e.message);
    }
  }
  const tv = await get(SITE + '/tv-lite.html');
  const tvHasNavigation = ['view-podcasts', 'view-about', 'view-contact'].every(id => tv.body.indexOf('id="' + id + '"') >= 0);
  const tvHasCatalog = tv.body.indexOf('id="podcast-list"') >= 0 && tv.body.indexOf('class="grid"') >= 0;
  const tvHasPlayer = tv.body.indexOf('id="audio"') >= 0 && tv.body.indexOf('id="now-playing"') >= 0;
  add('Dedicated TV experience responds', tv.response.ok && tvHasNavigation && tvHasCatalog && tvHasPlayer,
    'HTTP ' + tv.response.status + '; navigation=' + tvHasNavigation + ', catalog grid=' + tvHasCatalog + ', player=' + tvHasPlayer);

  add('Full desktop feature scripts remain referenced', ['/js/nightcast-app.js', '/js/nightcast-player.js', '/js/nightcast-theme.js']
    .every(path => html.indexOf(path) >= 0),
    'Core app, player, and theme scripts remain part of the full homepage');
  try {
    const { response, body } = await get(API + '/public/podcasts?page=1&limit=1');
    let count = 'unknown';
    if (response.ok) {
      const data = JSON.parse(body);
      const records = Array.isArray(data) ? data : (data.data || data.podcasts || data.items || data.results || []);
      const total = data.total ?? data.pagination?.total ?? data.meta?.total ?? (Array.isArray(records) ? records.length : 'unknown');
      count = 'pageRecords=' + (Array.isArray(records) ? records.length : 'unknown') + ', total=' + total;
    }
    add('Live podcast API reachable', response.ok, 'HTTP ' + response.status + ', ' + count);
  } catch (e) {
    add('Live podcast API reachable', false, e.message);
  }
  const summary = [
    '# NightCast internal-TV-browser compatibility audit',
    '',
    '- Site: ' + SITE,
    '- Scripts inspected: ' + sources.length,
    '- Critical resource failures: ' + assetFailures,
    '- Static compatibility warnings: ' + findings.length,
    '',
    '## Checks',
    ...checks.map(c => '- ' + (c.ok ? 'PASS' : 'FAIL') + ' — ' + c.name + ': ' + c.detail),
    '',
    '## Compatibility warnings',
    ...(findings.length ? findings.map(f => '- **' + f.name + '**: ' + f.detail) : ['- None detected by the limited static scanner.']),
    '',
    'Important: this audit checks the deployed site and syntax-risk indicators. It cannot identify the exact TV browser engine or prove physical-device compatibility.'
  ].join('\n');
  require('node:fs').mkdirSync('artifacts', { recursive: true });
  require('node:fs').writeFileSync('artifacts/nightcast-tv-compatibility-report.md', summary);
  const failures = checks.filter(c => !c.ok);
  console.log('SUMMARY | ' + checks.filter(c => c.ok).length + '/' + checks.length + ' checks passed | ' + findings.length + ' compatibility warning(s)');
  if (failures.length) process.exitCode = 1;
})().catch(error => {
  console.error('FATAL | ' + (error.stack || error.message));
  process.exitCode = 1;
});