const { chromium } = require('playwright');
const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const YAML = require('yaml');
const { transform } = require('lightningcss');

const results = [];
function report(name, passed, detail = '') {
  const value = Boolean(passed);
  results.push({ name, passed: value, detail });
  console.log((value ? 'TRUE' : 'FALSE') + ' | ' + name + (detail ? ' | ' + detail : ''));
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function walkFiles(root, extensionPattern, files = []) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'android' || entry.name === 'www') continue;
    const file = root + '/' + entry.name;
    if (entry.isDirectory()) walkFiles(file, extensionPattern, files);
    else if (extensionPattern.test(file)) files.push(file);
  }
  return files;
}
function silentWavDataUri() {
  const sampleRate = 8000;
  const samples = 40000;
  const data = Buffer.alloc(samples);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return 'data:audio/wav;base64,' + Buffer.concat([header, data]).toString('base64');
}

(async () => {
  let server;
  let browser;
  let pageForCoverage = null;
  let cssCoverageStarted = false;
  const runtimeErrors = [];
  try {
    // Static quality gates: HTML/style-tag balance, JavaScript syntax, CSS parsing, and YAML syntax.
    const htmlFilesToValidate = ['index.html', 'users/index.html', 'users/auth.html', 'users/login.html', 'users/loginnew.html', '404.html'];
    const malformedStyleFiles = [];
    const inlineStyleBlocks = [];
    for (const file of htmlFilesToValidate) {
      const html = fs.readFileSync(file, 'utf8');
      const opens = (html.match(/<style\b[^>]*>/gi) || []).length;
      const closes = (html.match(/<\/style\s*>/gi) || []).length;
      if (/<style\b(?![^>]*>)/i.test(html) || opens !== closes) malformedStyleFiles.push(file + ' (open=' + opens + ', close=' + closes + ')');
      for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
        inlineStyleBlocks.push({ file, code: match[1] });
      }
    }
    report('0. HTML inline style tags are balanced', malformedStyleFiles.length === 0,
      malformedStyleFiles.length ? malformedStyleFiles.join(', ') : htmlFilesToValidate.join(', '));

    const jsFailures = [];
    const jsFiles = walkFiles('.', /\.js$/i);
    for (const file of jsFiles) {
      try {
        const source = fs.readFileSync(file, 'utf8');
        const isKnownModule = /^(?:\\s*(?:import\\s+(?:[^'"]+?\\s+from\\s+)?['"]|export\\s+(?:\\{|\\*|default|const|let|var|function|class|async\\s+function)))/m.test(source);
        if (file.replace(/\\\\/g, '/').includes('/workers/') || isKnownModule) {
          const checked = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: source, encoding: 'utf8' });
          if (checked.status !== 0) throw new Error(checked.stderr || 'ES module syntax check failed');
        } else {
          new vm.Script(source, { filename: file });
        }
      } catch (error) { jsFailures.push(file + ': ' + error.message); }
    }
    report('0.1. JavaScript files pass syntax parsing', jsFailures.length === 0,
      jsFailures.slice(0, 8).join(' || ') || 'Parsed ' + jsFiles.length + ' JavaScript files');

    const cssFailures = [];
    const cssFiles = walkFiles('.', /\.css$/i);
    for (const file of cssFiles) {
      try { transform({ filename: file, code: Buffer.from(fs.readFileSync(file, 'utf8')) }); }
      catch (error) { cssFailures.push(file + ': ' + error.message); }
    }
    for (const block of inlineStyleBlocks) {
      try { transform({ filename: block.file + '.inline.css', code: Buffer.from(block.code) }); }
      catch (error) { cssFailures.push(block.file + ' inline style: ' + error.message); }
    }
    report('0.2. CSS files and inline styles parse cleanly', cssFailures.length === 0,
      cssFailures.slice(0, 8).join(' || ') || 'Parsed ' + cssFiles.length + ' CSS files and ' + inlineStyleBlocks.length + ' inline style blocks');

    const yamlFailures = [];
    const yamlFiles = walkFiles('.', /\.(?:yml|yaml)$/i);
    for (const file of yamlFiles) {
      try { YAML.parse(fs.readFileSync(file, 'utf8'), { uniqueKeys: true }); }
      catch (error) { yamlFailures.push(file + ': ' + error.message); }
    }
    report('0.3. YAML configuration files parse cleanly', yamlFailures.length === 0,
      yamlFailures.slice(0, 8).join(' || ') || 'Parsed ' + yamlFiles.length + ' YAML files');

    const linkFailures = [];
    const assetFailures = [];
    for (const file of htmlFilesToValidate) {
      const html = fs.readFileSync(file, 'utf8');
      const ids = new Set([...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]));
      for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']#([^"']*)["'][^>]*>/gi)) {
        const target = match[1].trim();
        if (target && target !== '!' && !ids.has(target)) {
          linkFailures.push(file + ':' + html.slice(0, match.index).split('\n').length + ' -> #' + target);
        }
      }
      for (const match of html.matchAll(/<(script|link|img|source|audio|video)\b([^>]*?)>/gi)) {
        const tag = match[1].toLowerCase();
        const attrs = match[2];
        const attr = name => {
          const found = attrs.match(new RegExp("\\b" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')", 'i'));
          return found?.[1] ?? found?.[2] ?? '';
        };
        let url = '';
        if (tag === 'script' || tag === 'img' || tag === 'source' || tag === 'audio' || tag === 'video') url = attr('src');
        if (tag === 'link' && /stylesheet|icon|manifest|apple-touch-icon/i.test(attr('rel'))) url = attr('href');
        if (!url || /^(?:https?:|\/\/|data:|blob:|javascript:|#)/i.test(url) || /escapeHtml|\$\{|\s\+\s/.test(url)) continue;
        url = url.split('#')[0].split('?')[0];
        if (!url) continue;
        const resolved = path.normalize(url.startsWith('/') ? '.' + url : path.join(path.dirname(file), url));
        const candidate = path.resolve(resolved);
        const directoryIndex = path.join(candidate, 'index.html');
        if (!fs.existsSync(candidate) && !fs.existsSync(directoryIndex)) {
          assetFailures.push(file + ':' + html.slice(0, match.index).split('\n').length + ' -> ' + url);
        }
      }
    }
    const missingLocalReferences = [...linkFailures, ...assetFailures];
    report('0.4. Local in-page links and static assets exist', missingLocalReferences.length === 0,
      missingLocalReferences.slice(0, 10).join(' || ') || 'No broken local anchors or static asset paths in the six HTML entry pages');

    const iconCdnFailures = [];
    for (const file of htmlFilesToValidate) {
      const html = fs.readFileSync(file, 'utf8');
      const hasIcons = /\bfa-(?:solid|regular|brands)\b/.test(html);
      if (!hasIcons) continue;
      const hasLocalIconStylesheet = /href=["'][^"']*\/assets\/vendor\/fontawesome\/css\/all\.min\.css["']/i.test(html);
      const hasExternalIconCdn = /(?:cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome|cdn\.jsdelivr\.net\/npm\/@fortawesome\/fontawesome-free)/i.test(html);
      if (!hasLocalIconStylesheet || hasExternalIconCdn) {
        iconCdnFailures.push(file + ' must use the self-hosted Font Awesome stylesheet with no CDN dependency');
      }
    }
report('0.5. Font Awesome uses self-hosted assets without CDN fallback', iconCdnFailures.length === 0,
      iconCdnFailures.join(', ') || 'Icon-bearing documents use a primary stylesheet and no unconditional duplicate request');

    const staticAssetAudit = spawnSync(process.execPath, ['tests/cdn-asset-audit.cjs','--strict-assets'], { encoding: 'utf8' });
    const auditSummary = (staticAssetAudit.stdout || '').split(/\r?\n/).find(line => line.startsWith('CDN INVENTORY')) || staticAssetAudit.stderr || '';
    report('0.5.1. Runtime has no static CDN asset or remote podcast-cover references', staticAssetAudit.status === 0, auditSummary.trim());

    const fallbackCatalog = JSON.parse(fs.readFileSync('users/data/podcasts.json','utf8'));
    const requiredLocalAssets = [
      '/assets/fonts/vazirmatn.css',
      '/assets/fonts/vazirmatn/vazirmatn-01.woff2',
      '/assets/fonts/vazirmatn/vazirmatn-02.woff2',
      '/assets/fonts/vazirmatn/vazirmatn-03.woff2',
      '/assets/vendor/fontawesome/css/all.min.css',
      '/assets/vendor/fontawesome/webfonts/fa-solid-900.woff2',
      '/assets/vendor/fontawesome/webfonts/fa-regular-400.woff2',
      '/assets/vendor/fontawesome/webfonts/fa-brands-400.woff2',
      '/assets/vendor/leaflet/leaflet.css',
      '/assets/vendor/leaflet/leaflet.js',
      '/assets/vendor/leaflet/images/marker-icon.png',
      ...['midnight-cosmos','moonlight','aurora','studio-noir','deep-ocean','royal-gold','neon-city','persian-heritage'].map(id => '/assets/themes/' + id + '.jpg'),
      ...['1F431','1F436','1F43C','1F981','1F98A','1F43A','1F42F','1F430','1F43B','1F418','1F433','1F42C','1F989','1F985','1F98B','1F984','1F42E','1F437','1F438','1F427'].map(code => '/assets/avatars/openmoji/' + code + '.svg'),
      ...(fallbackCatalog.podcasts || []).map(podcast => podcast.cover_url)
    ];
    const missingLocalAssets = [...new Set(requiredLocalAssets)].filter(asset => typeof asset !== 'string' || !asset.startsWith('/assets/') || !fs.existsSync('.' + asset));
    report('0.5.2. Theme, font, icon, map, avatar and podcast-cover files are self-hosted', missingLocalAssets.length === 0,
      missingLocalAssets.slice(0,12).join(', ') || 'All expected local asset files exist');

    // Only the root document is indexable; legacy paths are small aliases into its sections.
    const routeMetadataExpectations = [
      { file: 'index.html', canonical: 'https://nightcast.ir/', title: 'NightCast | آرشیو پادکست‌های صوتی، خلاصه و تحلیل کتاب' }
    ];
    const routeMetadataFailures = [];
    for (const route of routeMetadataExpectations) {
      const html = fs.readFileSync(route.file, 'utf8');
      const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
      const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
      const ogUrl = html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i)?.[1];
      const rssUrl = html.match(/<link\s+rel="alternate"\s+type="application\/rss\+xml"[^>]*href="([^"]+)"/i)?.[1];
      if (canonical !== route.canonical) routeMetadataFailures.push(route.file + ' canonical=' + canonical);
      if (title !== route.title) routeMetadataFailures.push(route.file + ' title=' + title);
      if (ogUrl !== route.canonical) routeMetadataFailures.push(route.file + ' og:url=' + ogUrl);
      if (rssUrl !== 'https://nightcast.ir/data/podcasts.xml') routeMetadataFailures.push(route.file + ' RSS=' + rssUrl);
    }
    report('0.6. Canonical root metadata and RSS discovery are correct',
      routeMetadataFailures.length === 0,
      routeMetadataFailures.join(' || ') || 'Canonical HTML, social URL, title, and RSS feed agree on the root document');

    const routeAliasFailures = [];
    for (const alias of [
      { file: 'users/index.html', section: 'podcasts' },
      { file: 'about/index.html', section: 'about' },
      { file: 'contact/index.html', section: 'contact' }
    ]) {
      const html = fs.readFileSync(alias.file, 'utf8');
      if (html.length >= 2000) routeAliasFailures.push(alias.file + ' is not a lightweight alias (' + html.length + ' bytes)');
      if (!html.includes('noindex,follow')) routeAliasFailures.push(alias.file + ' must be noindex');
      if (!html.includes('href="https://nightcast.ir/"')) routeAliasFailures.push(alias.file + ' canonical must be root');
      if (!html.includes('target.hash = "";' ) || !html.includes('target.searchParams.set("__route", "' + alias.section + '")')) routeAliasFailures.push(alias.file + ' clean route target is missing');
      if (!html.includes('window.location.replace(target.toString())')) routeAliasFailures.push(alias.file + ' redirect is missing');
      if (!html.includes('href="' + (alias.section === "podcasts" ? "/" : "/" + alias.section) + '"')) routeAliasFailures.push(alias.file + ' fallback link is missing');
    }
    report('0.7. Legacy archive/About/Contact documents are lightweight aliases',
      routeAliasFailures.length === 0,
      routeAliasFailures.join(' || ') || 'Three compatibility documents preserve query parameters and use clean section URLs');

    const cleanRouteFailures = [];
    const archiveHtml = fs.readFileSync('index.html', 'utf8');
    const redirects = fs.readFileSync('_redirects', 'utf8');
    const routeScript = fs.readFileSync('js/clean-routes.js', 'utf8');
    const cosmosScript = fs.readFileSync('js/nightcast-cosmos.js', 'utf8');
    if (/<a\b[^>]*\bhref=["']#(?:podcasts|about|contact)["']/i.test(archiveHtml) || cosmosScript.includes('cue.href="#podcasts"')) {
      cleanRouteFailures.push('archive or generated navigation still links to section fragments');
    }
    if (archiveHtml.includes('history.pushState({ nightcastPage: id }, "", "#" + id)')) {
      cleanRouteFailures.push('animated page router still writes hash URLs');
    }
    if (!redirects.includes('/about /index.html 200') || !redirects.includes('/contact /index.html 200')) {
      cleanRouteFailures.push('About/Contact must rewrite to the shared document while retaining clean paths');
    }
    if (!routeScript.includes('history.replaceState') || !routeScript.includes('sectionPaths')) {
      cleanRouteFailures.push('clean route resolver or legacy hash migration is missing');
    }
    report('0.8. Navigation uses clean paths and does not generate section hashes',
      cleanRouteFailures.length === 0,
      cleanRouteFailures.join(' || ') || 'Navigation uses /, /about, and /contact; legacy fragments are migrated away');

    // Activity 1.9: validate the committed static mirror used when D1 reaches its daily row-read limit.
    try {
      const fallbackSource = JSON.parse(fs.readFileSync('users/data/podcasts.json', 'utf8'));
      const fallbackRecords = Array.isArray(fallbackSource.podcasts) ? fallbackSource.podcasts : [];
      const activeFallbackRecords = fallbackRecords.filter(podcast => podcast && podcast.status === 'active');
      const malformedFallbackRecords = activeFallbackRecords.filter(podcast =>
        !podcast.id || !podcast.title || !podcast.slug || !podcast.audio_url || !podcast.cover_url
      );
      report('1.9. Static podcast fallback dataset is healthy',
        fallbackSource.success === true && activeFallbackRecords.length > 0 && malformedFallbackRecords.length === 0,
        'active=' + activeFallbackRecords.length + ', malformed=' + malformedFallbackRecords.length +
        ', updated=' + (fallbackSource.updated_at || 'unknown'));
    } catch (fallbackDataError) {
      report('1.9. Static podcast fallback dataset is healthy', false, String(fallbackDataError.message || fallbackDataError));
    }

    // Activity 2: validate the real public API and record its response latency.
    // Use curl for this external smoke test: Node 22's undici parser can throw
    // an uncaught internal assertion when the remote edge closes a streamed socket.
    try {
      const apiStartedAt = Date.now();
      const apiUrl = 'https://nightcast-shield.tomasgermany2580.workers.dev/api/v1/public/podcasts?page=1&limit=5';
      const apiResult = spawnSync('curl', [
        '--silent', '--show-error', '--fail', '--max-time', '12',
        '--write-out', '__HTTP_STATUS__%{http_code}', '-H', 'Accept: application/json', apiUrl
      ], { encoding: 'utf8', timeout: 13000, maxBuffer: 2 * 1024 * 1024 });
      if (apiResult.error) throw apiResult.error;
      if (apiResult.status !== 0) throw new Error((apiResult.stderr || 'curl failed').trim() + ' (exit ' + apiResult.status + ')');
      const statusSeparator = apiResult.stdout.lastIndexOf('__HTTP_STATUS__');
      if (statusSeparator < 0) throw new Error('API response did not include an HTTP status');
      const responseBody = apiResult.stdout.slice(0, statusSeparator);
      const status = Number(apiResult.stdout.slice(statusSeparator + '__HTTP_STATUS__'.length).trim());
      const payload = JSON.parse(responseBody);
      const apiFirstPageMs = Date.now() - apiStartedAt;
      const ok = status === 200 && payload?.success === true && Array.isArray(payload.podcasts) && payload.podcasts.length > 0;
      report('2. Real podcast API returns live records', ok,
        'HTTP ' + status + ', first-page=' + apiFirstPageMs + 'ms, records=' + (payload?.podcasts?.length ?? 'n/a') +
        ', reported-total=' + (payload?.total ?? 'n/a'));
    } catch (error) {
      report('2. Real podcast API returns live records', false, String(error.message || error));
    }

    // Activity 2.1: ensure the public stats/comments reads also degrade safely when D1 is rate-limited.
    try {
      const staticFallback = JSON.parse(fs.readFileSync('users/data/podcasts.json', 'utf8'));
      const samplePodcastId = staticFallback.podcasts?.find(podcast => podcast?.status === 'active')?.id;
      const readOnlyEndpoints = [
        { name: '2.1. Public podcast stats API responds successfully', url: 'https://nightcast-shield.tomasgermany2580.workers.dev/api/v1/public/podcasts/stats', shape: payload => payload?.stats && typeof payload.stats === 'object' },
        { name: '2.2. Public podcast comments API responds successfully', url: 'https://nightcast-shield.tomasgermany2580.workers.dev/api/v1/public/podcasts/' + encodeURIComponent(samplePodcastId) + '/comments', shape: payload => Array.isArray(payload?.comments) },
        { name: '2.3. Public podcast search API responds successfully', url: 'https://nightcast-shield.tomasgermany2580.workers.dev/api/v1/public/podcasts/search?q=' + encodeURIComponent('\u067e\u0646\u062c\u0645\u06cc\u0646'), shape: payload => Array.isArray(payload?.podcasts) && payload.podcasts.length > 0 }
      ];
      for (const endpoint of readOnlyEndpoints) {
        try {
          const response = spawnSync('curl', [
            '--silent', '--show-error', '--max-time', '12',
            '--write-out', '__HTTP_STATUS__%{http_code}',
            '-H', 'Accept: application/json', endpoint.url
          ], { encoding: 'utf8', timeout: 13000, maxBuffer: 2 * 1024 * 1024 });
          if (response.error) throw response.error;
          if (response.status !== 0) throw new Error((response.stderr || 'curl failed').trim());
          const separator = response.stdout.lastIndexOf('__HTTP_STATUS__');
          if (separator < 0) throw new Error('Missing HTTP status');
          const status = Number(response.stdout.slice(separator + '__HTTP_STATUS__'.length).trim());
          const payload = JSON.parse(response.stdout.slice(0, separator));
          const ok = status === 200 && payload?.success === true && endpoint.shape(payload);
          report(endpoint.name, ok, 'HTTP ' + status + ', success=' + String(payload?.success) + (payload?.degraded ? ', degraded=true' : ''));
        } catch (endpointError) {
          report(endpoint.name, false, String(endpointError.message || endpointError));
        }
      }
    } catch (readOnlySmokeError) {
      report('2.1. Public podcast stats API responds successfully', false, String(readOnlySmokeError.message || readOnlySmokeError));
      report('2.2. Public podcast comments API responds successfully', false, String(readOnlySmokeError.message || readOnlySmokeError));
    }

    server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1'], {
      stdio: 'ignore',
      detached: false
    });
    let serverReady = false;
    for (let i = 0; i < 40; i++) {
      const connected = await new Promise(resolve => {
        const socket = net.createConnection({ host: '127.0.0.1', port: 4173 });
        let settled = false;
        const finish = value => {
          if (settled) return;
          settled = true;
          socket.destroy();
          resolve(value);
        };
        socket.once('connect', () => finish(true));
        socket.once('error', () => finish(false));
        socket.setTimeout(300, () => finish(false));
      });
      if (connected) { serverReady = true; break; }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert(serverReady, 'Local static server did not start');

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1365, height: 900 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block'
    });
    await context.addInitScript(() => {
      localStorage.setItem('NightCastToken', 'ci-test-token');
      localStorage.setItem('NightCastUser', JSON.stringify({ id: 1, name: 'CI Test' }));
      if (navigator.serviceWorker) {
        navigator.serviceWorker.register = async () => ({ scope: location.origin + '/' });
      }
    });
    const page = await context.newPage();
    pageForCoverage = page;
    try {
      await page.coverage.startCSSCoverage({ resetOnNavigation: false });
      cssCoverageStarted = true;
    } catch (coverageError) {
      report('9. CSS coverage instrumentation starts', false, String(coverageError.message || coverageError));
    }
    const browserErrors = [];
    page.on('pageerror', error => {
      const detail = 'pageerror: ' + error.message;
      browserErrors.push(detail);
      runtimeErrors.push(detail);
    });
    page.on('requestfailed', request => browserErrors.push('requestfailed: ' + request.url() + ' ' + (request.failure()?.errorText || '')));
    page.on('console', message => {
      if (message.type() !== 'error') return;
      const detail = 'console: ' + message.text();
      browserErrors.push(detail);
      if (!/Failed to load resource:|net::ERR_|ERR_ABORTED|favicon\.ico/i.test(message.text())) runtimeErrors.push(detail);
    });
    const fixtureAudio = silentWavDataUri();
    let apiMockHits = 0;
    const podcasts = [
      {
        id: 91001, title: 'سیاره آزمایشی اول', book_name: 'کتاب آزمایشی', author_name: 'NightCast CI',
        category_name: 'آزمایش', description: 'توضیحات آزمایش جست‌وجو', short_description: 'توضیح کوتاه آزمایش',
        summary: 'خلاصه آزمایش', transcript: 'متن کامل آزمایش', audio_url: fixtureAudio,
        cover_url: 'https://example.invalid/cover-one.jpg', duration_seconds: 1, tags: ['آزمایش']
      },
      {
        id: 91002, title: 'سیاره آزمایشی دوم', book_name: 'کتاب دوم', author_name: 'NightCast CI',
        category_name: 'دانش', description: 'محتوای نمونه دوم', short_description: 'توضیح نمونه دوم',
        summary: 'خلاصه دوم', transcript: 'متن دوم', audio_url: fixtureAudio,
        cover_url: 'https://example.invalid/cover-two.jpg', duration_seconds: 1, tags: ['دانش']
      },
      {
        id: 91003, title: 'سیاره آزمایشی سوم', book_name: 'کتاب سوم', author_name: 'NightCast CI',
        category_name: 'فرهنگ', description: 'محتوای نمونه سوم', short_description: 'توضیح نمونه سوم',
        summary: 'خلاصه سوم', transcript: 'متن سوم', audio_url: fixtureAudio,
        cover_url: 'https://example.invalid/cover-three.jpg', duration_seconds: 1, tags: ['فرهنگ']
      },
      {
        id: 91004, title: 'سیاره آزمایشی چهارم', book_name: 'کتاب چهارم', author_name: 'NightCast CI',
        category_name: 'هنر', description: 'محتوای نمونه چهارم', short_description: 'توضیح نمونه چهارم',
        summary: 'خلاصه چهارم', transcript: 'متن چهارم', audio_url: fixtureAudio,
        cover_url: 'https://example.invalid/cover-four.jpg', duration_seconds: 1, tags: ['هنر']
      },
      {
        id: 91005, title: 'سیاره آزمایشی پنجم', book_name: 'کتاب پنجم', author_name: 'NightCast CI',
        category_name: 'ادبیات', description: 'محتوای نمونه پنجم', short_description: 'توضیح نمونه پنجم',
        summary: 'خلاصه پنجم', transcript: 'متن پنجم', audio_url: fixtureAudio,
        cover_url: 'https://example.invalid/cover-five.jpg', duration_seconds: 1, tags: ['ادبیات']
      }
    ];

    await page.route('https://nightcast-shield.tomasgermany2580.workers.dev/**', async route => {
      apiMockHits++;
      const url = new URL(route.request().url());
      const pathname = url.pathname;
      if (pathname.endsWith('/public/podcasts') && route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, total: podcasts.length, podcasts }) });
      }
      if (pathname.endsWith('/public/podcasts/stats')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, total: podcasts.length, stats: {} }) });
      }
      if (pathname.endsWith('/auth/status')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, authenticated: true }) });
      }
      if (pathname.endsWith('/public/favorites') || pathname.includes('/public/favorites/')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, favorites: [] }) });
      }
      if (pathname.endsWith('/comments')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, comments: [] }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    });
    const feedFixture = { total: podcasts.length, podcasts };
    await page.route('https://nightcast.ir/users/data/podcasts.json**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(feedFixture) }));
    await page.route('https://www.nightcast.ir/users/data/podcasts.json**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(feedFixture) }));
    await page.route('https://www.nightcast.ir/version.json**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: '5.2.3' }) }));
    await page.route(/https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|unpkg\.com)\//, route => route.abort());

    // Activity 1: root is the canonical podcast document; no timed redirect or second HTML navigation.
    let splashOk = false;
    try {
      await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForSelector('#podcastGrid', { state: 'attached', timeout: 5000 });
      assert(new URL(page.url()).pathname === '/', 'Root route navigated away from the canonical document');
      assert(await page.locator('#heroTitle, main .hero').count() === 0, 'Welcome hero must not be present on the canonical podcast entry');
      assert(await page.locator('main > #podcasts').count() === 1, 'Podcast archive must be the first main content section');
      assert(await page.locator('#nc-entry-loader').count() === 1, 'Galaxy loader is missing from the root archive document');
      await page.waitForFunction(() => { const loader = document.getElementById('nc-entry-loader'); return !loader || loader.classList.contains('is-hidden'); }, null, { timeout: 15000 });
      assert(await page.locator('#podcastGrid .podcast-card').count() > 0, 'Loader disappeared before podcast cards were rendered');
      const startupMetrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const paints = performance.getEntriesByType('paint');
        const resources = performance.getEntriesByType('resource');
        const localResources = resources.filter(item => new URL(item.name).origin === location.origin);
        const cssResources = localResources.filter(item => /\.css(?:\?|$)/i.test(item.name));
        const jsResources = localResources.filter(item => /\.js(?:\?|$)/i.test(item.name));
        const leafLetRequests = resources.filter(item => item.name.includes('/assets/vendor/leaflet/'));
        return {
          domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
          loadEventMs: nav ? Math.round(nav.loadEventEnd) : null,
          firstContentfulPaintMs: Math.round(paints.find(item => item.name === 'first-contentful-paint')?.startTime || 0),
          localCssRequests: cssResources.length,
          localCssTransferBytes: cssResources.reduce((sum, item) => sum + (item.transferSize || 0), 0),
          localJsRequests: jsResources.length,
          localJsTransferBytes: jsResources.reduce((sum, item) => sum + (item.transferSize || 0), 0),
          initialLeafletRequests: leafLetRequests.length
        };
      });
      report('1.4. Initial-load performance telemetry and lazy map assets',
        startupMetrics.domContentLoadedMs !== null && startupMetrics.initialLeafletRequests === 0,
        JSON.stringify(startupMetrics));
      splashOk = true;
      report('1. Root route is the single canonical podcast document', true, new URL(page.url()).pathname + '; loader dismissed after podcast cards rendered');
      await page.goto('http://127.0.0.1:4173/podcasts/?legacy=1#podcasts', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForURL(url => url.pathname === '/' && url.search === '?legacy=1' && url.hash === '', { timeout: 5000 });
      await page.waitForSelector('#podcastGrid', { state: 'attached', timeout: 5000 });
      report('1.2. Legacy /podcasts links redirect to root without a fragment', true, page.url());
    } catch (error) {
      report('1. Root route is the single canonical podcast document', false, String(error.message || error));
    }

    // Activity 1.3: legacy section documents land on clean section URLs without hashes.
    try {
      await page.goto('http://127.0.0.1:4173/about/index.html?alias=about', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForURL(url => url.pathname === '/about' && url.search === '?alias=about' && url.hash === '', { timeout: 5000 });
      await page.waitForSelector('#about', { state: 'attached', timeout: 5000 });
      await page.waitForFunction(() => !!document.querySelector('.nav-link[href="/about"].active'), null, { timeout: 5000 });

      await page.goto('http://127.0.0.1:4173/contact/index.html?alias=contact#podcasts', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForURL(url => url.pathname === '/contact' && url.search === '?alias=contact' && url.hash === '', { timeout: 5000 });
      await page.waitForSelector('#contact', { state: 'attached', timeout: 5000 });
      await page.waitForFunction(() => !!document.querySelector('.nav-link[href="/contact"].active'), null, { timeout: 5000 });
      report('1.3. Legacy section aliases resolve to clean section URLs', true, page.url());
    } catch (error) {
      report('1.3. Legacy section aliases resolve to clean section URLs', false, String(error.message || error));
    }

    // Verify sticky header geometry, desktop navigation fit, and an actual CDN icon glyph.
    try {
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(350);
      const headerState = await page.evaluate(() => {
        const header = document.querySelector('.nc-header');
        const nav = header?.querySelector('.nc-nav');
        const links = header?.querySelector('.nav-links');
        const icon = header?.querySelector('.nav-link-button i, .header-actions i');
        const brandImage = header?.querySelector('.brand-mark img');
        const pseudo = icon ? getComputedStyle(icon, '::before') : null;
        const hr = header?.getBoundingClientRect();
        return {
          position: header ? getComputedStyle(header).position : 'missing',
          top: header ? getComputedStyle(header).top : 'missing',
          headerLeft: Math.round(hr?.left ?? -999),
          headerRight: Math.round(hr?.right ?? -999),
          headerWidth: Math.round(hr?.width ?? 0),
          viewportWidth: document.documentElement.clientWidth,
          navWidth: Math.round(nav?.clientWidth ?? 0),
          navScrollWidth: Math.round(nav?.scrollWidth ?? 0),
          navLinksDisplay: links ? getComputedStyle(links).display : 'missing',
          iconFamily: pseudo?.fontFamily || 'missing',
          iconContent: pseudo?.content || 'missing',
          iconFontLoaded: document.fonts.check('900 16px "Font Awesome 6 Free"'),
          localIconStylesheet: !!document.querySelector('link[href*="/assets/vendor/fontawesome/css/all.min.css"]'),
          brandImagePresent: !!brandImage,
          brandImageLoaded: !!brandImage && brandImage.complete && brandImage.naturalWidth > 0
        };
      });
      const headerAndIconsOk = headerState.position === 'sticky' &&
        headerState.top === '0px' &&
        headerState.headerLeft >= -1 &&
        headerState.headerRight <= headerState.viewportWidth + 1 &&
        headerState.navScrollWidth <= headerState.navWidth + 2 &&
        headerState.navLinksDisplay !== 'none' &&
        /Font Awesome/i.test(headerState.iconFamily) &&
        !!headerState.iconContent && headerState.iconContent !== 'none' && headerState.iconContent !== '""' &&
        headerState.iconFontLoaded && headerState.localIconStylesheet &&
        headerState.brandImagePresent && headerState.brandImageLoaded;
      report('1.1. Desktop header fits viewport and CDN icons render', headerAndIconsOk, JSON.stringify(headerState));
    } catch (error) {
      report('1.1. Desktop header fits viewport and CDN icons render', false, String(error.message || error));
    }

    // The archive uses cinematic page navigation: open the Podcasts page before testing its cards.
    try {
      await page.locator('.nc-nav .nav-link[href="/"]').click();
      await page.waitForFunction(() => {
        const section = document.querySelector('#podcasts');
        return !!section && !section.hidden && getComputedStyle(section).display !== 'none';
      }, undefined, { timeout: 5000 });
    } catch (error) {
      report('3. Selecting a planet opens the matching podcast details', false, 'Podcast page navigation failed: ' + String(error.message || error));
      report('4. Search, player, favorites and comments controls work', false, 'Podcast page navigation failed');
      report('5. Mobile, tablet, desktop and TV layouts avoid horizontal overflow', false, 'Podcast page navigation failed');
      throw new Error('Podcast page navigation prerequisite failed');
    }

    // Wait for the mocked catalogue so UI interactions are deterministic.
    try {
      const firstCard = page.locator('.podcast-card[data-id="91001"]');
      await firstCard.waitFor({ state: 'attached', timeout: 10000 });
      await firstCard.scrollIntoViewIfNeeded();
      await firstCard.waitFor({ state: 'visible', timeout: 5000 });
    } catch (error) {
      const diagnostic = await page.evaluate(() => {
        const card = document.querySelector('.podcast-card[data-id="91001"]');
        const grid = document.querySelector('#podcastGrid');
        const section = document.querySelector('#podcasts');
        const info = el => el ? { tag: el.tagName, className: el.className, display: getComputedStyle(el).display, visibility: getComputedStyle(el).visibility, opacity: getComputedStyle(el).opacity, rect: (() => { const r = el.getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height }; })() } : null;
        return { card: info(card), grid: info(grid), section: info(section), body: info(document.body) };
      });
      report('3. Selecting a planet opens the matching podcast details', false, 'Podcast cards did not render: ' + String(error.message || error) + ' | diagnostic=' + JSON.stringify(diagnostic) + ' | API mock hits=' + apiMockHits + ' | browser errors: ' + browserErrors.join(' || '));
      report('4. Search, player, favorites and comments controls work', false, 'Prerequisite podcast cards did not render | API mock hits=' + apiMockHits + ' | browser errors: ' + browserErrors.join(' || '));
      report('5. Mobile, tablet, desktop and TV layouts avoid horizontal overflow', false, 'Page could not reach the rendered catalogue | API mock hits=' + apiMockHits + ' | browser errors: ' + browserErrors.join(' || '));
      throw new Error('Catalogue rendering prerequisite failed');
    }

    // Explicitly opt into galaxy mode; list mode is the performance-friendly default.
    try {
      const initialView = await page.evaluate(() => ({
        mode: document.querySelector('#podcasts')?.dataset.viewMode,
        gridVisible: getComputedStyle(document.querySelector('#podcastGrid')).display !== 'none',
        hasConstellation: !!document.querySelector('#ncConstellation'),
        hasStarfield: !!document.querySelector('.nc-cosmos-canvas')
      }));
      assert(initialView.mode === 'list' && initialView.gridVisible && !initialView.hasConstellation && !initialView.hasStarfield,
        'List mode should not mount the duplicate constellation or animated starfield: ' + JSON.stringify(initialView));
      await page.locator('[data-nc-view="galaxy"]').click();
      await page.waitForSelector('#ncConstellation .nc-planet', { state: 'visible', timeout: 7000 });
      const viewState = await page.evaluate(() => ({
        mode: document.querySelector('#podcasts')?.dataset.viewMode,
        gridDisplay: getComputedStyle(document.querySelector('#podcastGrid')).display,
        galaxyVisible: !!document.querySelector('#ncConstellation') && getComputedStyle(document.querySelector('#ncConstellation')).display !== 'none',
        hasStarfield: !!document.querySelector('.nc-cosmos-canvas'),
        storedMode: localStorage.getItem('nightcast-podcast-view-mode'),
        activePressed: document.querySelector('[data-nc-view="galaxy"]')?.getAttribute('aria-pressed')
      }));
      assert(viewState.mode === 'galaxy' && viewState.gridDisplay === 'none' && viewState.galaxyVisible,
        'Galaxy mode must hide the list instead of displaying both: ' + JSON.stringify(viewState));
      assert(viewState.storedMode === 'galaxy' && viewState.activePressed === 'true' && viewState.hasStarfield,
        'Galaxy choice was not saved, exposed accessibly, or did not activate its visual layer: ' + JSON.stringify(viewState));
      report('2.1 List and galaxy modes are exclusive and preference persists', true, JSON.stringify(viewState));
    } catch (error) {
      report('2.1 List and galaxy modes are exclusive and preference persists', false, String(error.message || error));
    }

    // Activity 3: the constellation item must open details for the same record.
    try {
      await page.waitForSelector('#ncConstellation .nc-planet', { timeout: 7000 });
      const planet = page.locator('#ncConstellation .nc-planet').filter({ hasText: 'سیاره آزمایشی اول' }).first();
      await planet.click();
      await page.waitForFunction(() => {
        const modal = document.querySelector('#ncPodcastDetail');
        return modal && modal.classList.contains('open') && modal.getAttribute('aria-hidden') === 'false';
      }, undefined, { timeout: 5000 });
      assert((await page.locator('#ncPodcastDetail').innerText()).includes('سیاره آزمایشی اول'), 'Details title does not match the selected planet');
      const detailPosition = await page.locator('#ncPodcastDetail').evaluate(el => getComputedStyle(el).position);
      assert(detailPosition === 'fixed', 'Podcast details dialog must be viewport-fixed; computed position=' + detailPosition);
      report('3. Selecting a planet opens the matching podcast details', true, 'Matching podcast opened; dialog position=' + detailPosition);
    } catch (error) {
      report('3. Selecting a planet opens the matching podcast details', false, String(error.message || error));
    }

    // Activity 4: verify search, player state, favorite mutation and comments entry.
    try {
      const detailIsOpen = await page.locator('#ncPodcastDetail').evaluate(el => el.classList.contains('open'));
      if (detailIsOpen) {
        await page.locator('#ncPodcastDetail .nc-detail-close').click();
        await page.waitForFunction(() => !document.querySelector('#ncPodcastDetail')?.classList.contains('open'), undefined, { timeout: 3000 });
      }
      await page.locator('[data-nc-view="list"]').click();
      await page.waitForFunction(() => {
        const section = document.querySelector('#podcasts');
        const grid = document.querySelector('#podcastGrid');
        return section?.dataset.viewMode === 'list' && !!grid && getComputedStyle(grid).display !== 'none' && !document.querySelector('#ncConstellation') && !document.querySelector('.nc-cosmos-canvas');
      }, undefined, { timeout: 5000 });
      const search = page.locator('#searchInput');
      await search.fill('سیاره آزمایشی اول');
      await page.waitForFunction(() => document.querySelectorAll('#podcastGrid .podcast-card').length === 1);
      console.log('PASS | Search filters the podcast catalogue');
      assert(await page.locator('#podcastGrid .podcast-card').first().getAttribute('data-id') === '91001', 'Search returned the wrong record');
      await page.locator('#searchClear').click();
      await page.waitForTimeout(300);
      const restoreDebug = await page.evaluate(() => ({
        cards: document.querySelectorAll('#podcastGrid .podcast-card').length,
        allRecords: window.NightCastPodcastBridge?.getPodcasts?.().length ?? -1,
        input: document.querySelector('#searchInput')?.value,
        clearClass: document.querySelector('#searchClear')?.className,
        cardIds: [...document.querySelectorAll('#podcastGrid .podcast-card')].map(card => card.dataset.id)
      }));
      assert(restoreDebug.cards === 5, 'Clearing search did not restore the full list: ' + JSON.stringify(restoreDebug));
      const catalogueState = await page.evaluate(() => {
        const loader = document.querySelector('#ncPodcastInitialLoader');
        return {
          count: document.querySelectorAll('#podcastGrid .podcast-card').length,
          hasInfiniteSentinel: !!document.querySelector('#podcastLoadSentinel'),
          hasPagination: !!document.querySelector('#pagination'),
          loaderHidden: !loader || getComputedStyle(loader).visibility === 'hidden' || loader.classList.contains('is-hidden'),
          ids: [...document.querySelectorAll('#podcastGrid .podcast-card')].map(card => card.dataset.id)
        };
      });
      assert(catalogueState.count === 5, 'The complete catalogue was not rendered at once');
      assert(!catalogueState.hasInfiniteSentinel && !catalogueState.hasPagination, 'Paging/infinite-scroll controls must be absent');
      assert(catalogueState.loaderHidden, 'Galaxy loader did not dismiss after the complete catalogue loaded');
      await page.evaluate(async () => {
        window.__nightcastCardRefs = [...document.querySelectorAll('#podcastGrid .podcast-card')];
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 180));
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 180));
      });
      const scrollStability = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('#podcastGrid .podcast-card')];
        return { count: cards.length, sameNodes: window.__nightcastCardRefs.length === cards.length && window.__nightcastCardRefs.every((card, index) => card === cards[index]) };
      });
      assert(scrollStability.count === 5 && scrollStability.sameNodes, 'Scrolling changed/replaced podcast card DOM nodes');
      report('4.1 Full catalogue renders once; scrolling does not replace cards', true, 'All 5 fixture records visible together; no paging controls; card DOM identity stable after down/up scroll');

      await page.locator('.podcast-card[data-id="91001"] [data-action="play"]').first().click();
      await page.waitForSelector('#playerBar.show', { timeout: 5000 });
      assert((await page.locator('#playerTitle').innerText()).includes('سیاره آزمایشی اول'), 'Player title does not match selected podcast');
      const audio = page.locator('audio').first();
      await page.waitForFunction(() => {
        const el = document.querySelector('audio');
        return !!el && !!el.src && el.readyState >= 2 && !el.paused;
      }, undefined, { timeout: 5000 });
      const audioState = await page.locator('audio').evaluate(el => ({ paused: el.paused, readyState: el.readyState }));
      assert(audioState.readyState >= 2 && audioState.paused === false, 'Audio did not enter playing state');
      console.log('PASS | Audio entered playing state');
      await page.locator('#playButton').click();
      await page.waitForFunction(() => document.querySelector('audio')?.paused === true, undefined, { timeout: 5000 });
      console.log('PASS | Audio pause control works');

      // The cover artwork itself should use the same shared play/pause state.
      const artwork = page.locator('.podcast-card[data-id="91001"] .podcast-cover');
      await artwork.click({ position: { x: 12, y: 12 } });
      await page.waitForFunction(() => {
        const audio = document.querySelector('audio');
        return !!audio && !audio.paused &&
          document.querySelector('.podcast-card[data-id="91001"] [data-action="play"] i')?.classList.contains('fa-pause');
      }, undefined, { timeout: 5000 });
      console.log('PASS | Clicking podcast artwork starts playback');
      await artwork.click({ position: { x: 12, y: 12 } });
      await page.waitForFunction(() => document.querySelector('audio')?.paused === true, undefined, { timeout: 5000 });
      await page.waitForFunction(() =>
        document.querySelector('.podcast-card[data-id="91001"] [data-action="play"] i')?.classList.contains('fa-play')
      , undefined, { timeout: 3000 });
      console.log('PASS | Clicking podcast artwork pauses playback and synchronizes the card icon');

      // Switch to galaxy mode only for the planet/detail interaction.
      await page.locator('[data-nc-view="galaxy"]').click();
      await page.waitForSelector('#ncConstellation .nc-planet', { state: 'visible', timeout: 5000 });
      // The detail-dialog button must toggle the same podcast and stay synchronized with card/player controls.
      const testPlanet = page.locator('#ncConstellation .nc-planet').filter({ hasText: 'سیاره آزمایشی اول' }).first();
      await testPlanet.click();
      await page.waitForFunction(() => document.querySelector('#ncPodcastDetail')?.classList.contains('open'), undefined, { timeout: 4000 });
      const detailPlay = page.locator('#ncPodcastDetail [data-action="play"]');
      assert(await detailPlay.getAttribute('data-id') === '91001', 'Detail play button targets the wrong podcast');
      await detailPlay.click();
      await page.waitForFunction(() => {
        const audio = document.querySelector('audio');
        return !!audio && !audio.paused && Number(document.querySelector('#ncPodcastDetail [data-action="play"]')?.dataset.id) === 91001;
      }, undefined, { timeout: 5000 });
      await page.waitForFunction(() =>
        document.querySelector('#ncPodcastDetail [data-action="play"] i')?.classList.contains('fa-pause') &&
        document.querySelector('.podcast-card[data-id="91001"] [data-action="play"] i')?.classList.contains('fa-pause') &&
        document.querySelector('#playButton i')?.classList.contains('fa-pause')
      , undefined, { timeout: 3000 });
      console.log('PASS | Detail play starts the selected podcast and synchronizes all play icons');

      await detailPlay.click();
      await page.waitForFunction(() => document.querySelector('audio')?.paused === true, undefined, { timeout: 5000 });
      await page.waitForFunction(() =>
        document.querySelector('#ncPodcastDetail [data-action="play"] i')?.classList.contains('fa-play') &&
        document.querySelector('.podcast-card[data-id="91001"] [data-action="play"] i')?.classList.contains('fa-play') &&
        document.querySelector('#playButton i')?.classList.contains('fa-play')
      , undefined, { timeout: 3000 });
      await page.locator('#ncPodcastDetail .nc-detail-close').click();
      await page.locator('[data-nc-view="list"]').click();
      await page.waitForFunction(() => {
        const section = document.querySelector('#podcasts');
        return section?.dataset.viewMode === 'list' && getComputedStyle(document.querySelector('#podcastGrid')).display !== 'none' && !document.querySelector('#ncConstellation') && !document.querySelector('.nc-cosmos-canvas');
      }, undefined, { timeout: 5000 });
      console.log('PASS | Detail play button toggles pause and synchronizes all play icons');

      await page.locator('.podcast-card[data-id="91001"] [data-action="favorite"]').click();
      await page.waitForFunction(() => document.querySelector('.podcast-card[data-id="91001"] [data-action="favorite"]')?.getAttribute('aria-pressed') === 'true', undefined, { timeout: 3000 });
      console.log('PASS | Favorite state toggled');

      const commentsButton = page.locator('.podcast-card[data-id="91001"] [data-action="comments"]').first();
      await commentsButton.waitFor({ state: 'visible', timeout: 5000 });
      await commentsButton.click();
      // Verify the user-facing click path itself. Do not call the opener directly as a fallback,
      // because that would hide a broken event handler and produce a false positive.
      try {
        await page.waitForFunction(() => {
          const modal = document.querySelector('#ncCommentsModal');
          return !!modal && modal.classList.contains('open') && modal.getAttribute('aria-hidden') === 'false';
        }, undefined, { timeout: 5000 });
      } catch (error) {
        const commentsState = await page.evaluate(() => {
          const modal = document.querySelector('#ncCommentsModal');
          const button = document.querySelector('.podcast-card[data-id="91001"] [data-action="comments"]');
          return {
            modalExists: !!modal,
            className: modal?.className || '',
            ariaHidden: modal?.getAttribute('aria-hidden') || '',
            openerType: typeof window.NightCastOpenPodcastComments,
            bodyClass: document.body.className,
            buttonId: button?.getAttribute('data-id') || '',
            buttonHtml: button?.outerHTML || ''
          };
        });
        throw new Error('Comments button click did not open the modal: ' + JSON.stringify(commentsState) + '; wait=' + String(error.message || error));
      }
      assert((await page.locator('#ncCommentsPodcastTitle').innerText()).includes('سیاره آزمایشی اول'), 'Comments opened for the wrong podcast');
      const commentsPosition = await page.locator('#ncCommentsModal').evaluate(el => getComputedStyle(el).position);
      assert(commentsPosition === 'fixed', 'Comments dialog must be viewport-fixed; computed position=' + commentsPosition);
      console.log('PASS | Comments dialog opens for selected podcast; position=' + commentsPosition);
      await page.locator('#ncCommentsClose').click();
      await page.waitForFunction(() => !document.querySelector('#ncCommentsModal')?.classList.contains('open'), undefined, { timeout: 3000 });
      report('4. Search, play/pause, favorites and comments work', true, 'Search, audio readiness/pause, favorite state and comments dialog verified');
    } catch (error) {
      report('4. Search, player, favorites and comments controls work', false, String(error.message || error));
    }

    // Activity 5: measure overflow at phone, tablet, desktop and TV viewports.
    try {
      const sizes = [
        { name: 'mobile', width: 390, height: 844 },
        { name: 'small-phone', width: 320, height: 740 },
        { name: 'phone-360', width: 360, height: 780 },
        { name: 'compact-tablet', width: 768, height: 1024 },
        { name: 'tablet-breakpoint', width: 801, height: 1100 },
        { name: 'tablet', width: 820, height: 1180 },
        { name: 'small-laptop', width: 900, height: 900 },
        { name: 'laptop-breakpoint', width: 1000, height: 900 },
        { name: 'laptop', width: 1024, height: 900 },
        { name: 'desktop', width: 1440, height: 1000 },
        { name: 'TV', width: 1920, height: 1080 }
      ];
      const failures = [];
      const headerFailures = [];
      const heroTitleFailures = [];
      const coverLayoutFailures = [];
      const visualArtifactDir = path.join(process.cwd(), 'artifacts', 'visual');
      fs.mkdirSync(visualArtifactDir, { recursive: true });
      let mobileNavigationPassed = false;
      let mobileNavigationDetail = 'mobile navigation check was not executed';
      for (const size of sizes) {
        await page.setViewportSize({ width: size.width, height: size.height });
        await page.waitForTimeout(120);
        const coverLayout = await page.evaluate(() => {
          const card = document.querySelector('.podcast-card[data-id="91001"]');
          const cover = card?.querySelector('.podcast-cover');
          const info = card?.querySelector('.podcast-info');
          if (!card || !cover || !info) return { missing: true };
          const cardRect = card.getBoundingClientRect();
          const coverRect = cover.getBoundingClientRect();
          const infoRect = info.getBoundingClientRect();
          return {
            missing: false,
            width: coverRect.width,
            height: coverRect.height,
            ratio: coverRect.height ? coverRect.width / coverRect.height : 0,
            cardRight: cardRect.right,
            coverRight: coverRect.right,
            infoTop: infoRect.top,
            coverTop: coverRect.top,
            infoLeft: infoRect.left,
            coverLeft: coverRect.left,
            infoHeight: infoRect.height,
            infoBottom: infoRect.bottom,
            cardBottom: cardRect.bottom,
            innerWidth: card.clientWidth
          };
        });
        if (coverLayout.missing) {
          coverLayoutFailures.push(size.name + ': cover/info/card missing');
        } else {
          const square = Math.abs(coverLayout.ratio - 1) < 0.035;
          const rightAligned = Math.abs(coverLayout.cardRight - coverLayout.coverRight) < 3;
          const correctFlow = coverLayout.coverTop < coverLayout.infoTop;
          const fullWidth = Math.abs(coverLayout.width - coverLayout.innerWidth) < 3;
          const detailsVisible = coverLayout.infoHeight > 0 && coverLayout.infoTop >= coverLayout.coverTop + coverLayout.height - 2 &&
            coverLayout.infoBottom <= coverLayout.cardBottom + 2;
          if (!square || !rightAligned || !correctFlow || !fullWidth || !detailsVisible) {
            coverLayoutFailures.push(size.name + ': ' + JSON.stringify({ square, rightAligned, correctFlow, fullWidth, detailsVisible, ...coverLayout }));
          }
        }
        if (['mobile', 'tablet', 'desktop', 'TV'].includes(size.name)) {
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          await page.waitForTimeout(180);
          await page.screenshot({ path: path.join(visualArtifactDir, size.name + '-podcasts-entry.png'), fullPage: false, animations: 'disabled' });
          const cosmosPanel = page.locator('#ncConstellation');
          if (await cosmosPanel.count()) {
            await cosmosPanel.scrollIntoViewIfNeeded();
            await page.waitForTimeout(180);
            await page.screenshot({ path: path.join(visualArtifactDir, size.name + '-cosmos.png'), fullPage: false, animations: 'disabled' });
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
            await page.waitForTimeout(350);
          }
        }
        if (size.name === 'mobile') {
          try {
            await page.locator('#ncMenuToggle').click({ timeout: 5000 });
            await page.waitForFunction(() => {
              const drawer = document.querySelector('#ncMobileDrawer');
              return !!drawer && drawer.classList.contains('is-open') && drawer.getAttribute('aria-hidden') === 'false';
            }, undefined, { timeout: 3000 });
            const drawerState = await page.evaluate(() => {
              const drawer = document.querySelector('#ncMobileDrawer');
              const backdrop = document.querySelector('#ncDrawerBackdrop');
              const d = drawer?.getBoundingClientRect();
              const b = backdrop?.getBoundingClientRect();
              const header = document.querySelector('.nc-header');
              const headerNav = header?.querySelector('.nc-nav');
              const navLinks = header?.querySelector('.nav-links');
              const brand = header?.querySelector('.brand');
              const menuToggle = document.querySelector('#ncMenuToggle');
              const toggleRect = menuToggle?.getBoundingClientRect();
              const headerRect = header?.getBoundingClientRect();
              const brandRect = brand?.getBoundingClientRect();
              return {
                drawerPosition: drawer ? getComputedStyle(drawer).position : 'missing',
                drawerWidth: Math.round(d?.width || 0),
                drawerHeight: Math.round(d?.height || 0),
                drawerRight: Math.round(d?.right || 0),
                backdropPosition: backdrop ? getComputedStyle(backdrop).position : 'missing',
                backdropWidth: Math.round(b?.width || 0),
                headerPosition: header ? getComputedStyle(header).position : 'missing',
                headerLeft: Math.round(headerRect?.left ?? -999),
                headerRight: Math.round(headerRect?.right ?? -999),
                headerWidth: Math.round(headerRect?.width || 0),
                navWidth: Math.round(headerNav?.clientWidth || 0),
                navScrollWidth: Math.round(headerNav?.scrollWidth || 0),
                navLinksDisplay: navLinks ? getComputedStyle(navLinks).display : 'missing',
                brandLeft: Math.round(brandRect?.left ?? -999),
                brandRight: Math.round(brandRect?.right ?? -999),
                menuToggleDisplay: menuToggle ? getComputedStyle(menuToggle).display : 'missing',
                menuToggleWidth: Math.round(toggleRect?.width || 0),
                viewportWidth: document.documentElement.clientWidth
              };
            });
            mobileNavigationPassed = drawerState.drawerPosition === 'fixed' &&
              drawerState.backdropPosition === 'fixed' &&
              drawerState.headerPosition === 'sticky' &&
              drawerState.menuToggleDisplay !== 'none' &&
              drawerState.menuToggleWidth > 0 &&
              drawerState.navLinksDisplay === 'none' &&
              drawerState.headerLeft >= -1 &&
              drawerState.headerRight <= drawerState.viewportWidth + 1 &&
              drawerState.navScrollWidth <= drawerState.navWidth + 2 &&
              drawerState.brandLeft >= -1 &&
              drawerState.brandRight <= drawerState.viewportWidth + 1 &&
              drawerState.drawerWidth > 0 &&
              drawerState.drawerHeight > 0 &&
              drawerState.backdropWidth >= drawerState.viewportWidth - 3;
            mobileNavigationDetail = JSON.stringify(drawerState);
            // The menu toggle sits behind the open drawer; use the drawer's own close control.
            await page.locator('#ncDrawerClose').click({ timeout: 3000 });
            await page.waitForFunction(() => !document.querySelector('#ncMobileDrawer')?.classList.contains('is-open'), undefined, { timeout: 3000 });
          } catch (error) {
            mobileNavigationPassed = false;
            mobileNavigationDetail = String(error.message || error);
            try {
              if (await page.locator('#ncMobileDrawer.is-open').count()) await page.locator('#ncDrawerClose').click({ timeout: 1000 });
            } catch {}
          }
        }
        const dims = await page.evaluate(() => {
          const viewport = document.documentElement.clientWidth;
          const offenders = [...document.querySelectorAll('body *')].map(el => {
            const rect = el.getBoundingClientRect();
            return { tag: el.tagName, id: el.id, className: typeof el.className === 'string' ? el.className.slice(0, 70) : '', left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), position: getComputedStyle(el).position, insideDrawer: !!el.closest('#ncMobileDrawer'), insideBackdrop: !!el.closest('#ncDrawerBackdrop') };
          }).filter(el => el.width > 0 && (el.right > viewport + 3 || el.left < -viewport * 0.5) && el.position !== 'fixed' && !el.insideDrawer && !el.insideBackdrop)
            .sort((a,b) => b.right - a.right).slice(0, 5);
          return {
            viewport,
            // The document viewport width is authoritative; body.scrollWidth can include a closed fixed drawer translated off-canvas.
            content: document.documentElement.scrollWidth,
            rootScroll: document.documentElement.scrollWidth,
            bodyScroll: document.body.scrollWidth,
            bodyMargin: getComputedStyle(document.body).margin,
            bodyPadding: getComputedStyle(document.body).padding,
            rootOverflowX: getComputedStyle(document.documentElement).overflowX,
            bodyOverflowX: getComputedStyle(document.body).overflowX,
            bodyRect: (() => { const r = document.body.getBoundingClientRect(); return { left:r.left, right:r.right, width:r.width }; })(),
            offenders,
            heroTitle: (() => {
              const title = document.querySelector('#heroTitle');
              const hero = document.querySelector('main#home .hero');
              if (!title && !hero) return { missing: true };
              if (!title || !hero) return { missing: false, overflow: true, detail: 'partial welcome hero markup remains' };
              const titleRect = title.getBoundingClientRect();
              const heroRect = hero.getBoundingClientRect();
              const heroStyle = getComputedStyle(hero);
              const paddingLeft = parseFloat(heroStyle.paddingLeft) || 0;
              const paddingRight = parseFloat(heroStyle.paddingRight) || 0;
              const safeGutter = window.innerWidth >= 1100
                ? Math.min(60, Math.max(24, window.innerWidth * 0.05))
                : window.innerWidth >= 761
                  ? Math.min(40, Math.max(20, window.innerWidth * 0.04))
                  : 14;
              const titleVisible = titleRect.width > 0 && titleRect.height > 0;
              return {
                visible: titleVisible,
                clientWidth: title.clientWidth,
                scrollWidth: title.scrollWidth,
                left: Math.round(titleRect.left),
                right: Math.round(titleRect.right),
                heroLeft: Math.round(heroRect.left),
                heroRight: Math.round(heroRect.right),
                paddingLeft,
                paddingRight,
                safeGutter,
                overflow: title.scrollWidth > title.clientWidth + 2 ||
                  paddingLeft < safeGutter - 1 ||
                  paddingRight < safeGutter - 1 ||
                  (titleVisible && (titleRect.left < heroRect.left + safeGutter || titleRect.right > heroRect.right - safeGutter))
              };
            })()
          };
        });
        if (dims.content > dims.viewport + 3) failures.push(size.name + ': ' + dims.content + 'px > ' + dims.viewport + 'px; elements=' + JSON.stringify(dims.offenders));
        if (!dims.heroTitle.missing || dims.heroTitle.overflow) heroTitleFailures.push(size.name + ': ' + JSON.stringify(dims.heroTitle));

        const headerState = await page.evaluate(() => {
          const header = document.querySelector('.nc-header');
          const nav = header?.querySelector('.nc-nav');
          const links = header?.querySelector('.nav-links');
          const brand = header?.querySelector('.brand');
          const actions = header?.querySelector('.header-actions');
          const toggle = header?.querySelector('.nc-menu-toggle');
          const rect = el => {
            const r = el?.getBoundingClientRect();
            return r ? { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) } : null;
          };
          return {
            position: header ? getComputedStyle(header).position : 'missing',
            header: rect(header),
            nav: rect(nav),
            navScrollWidth: nav?.scrollWidth ?? -1,
            linksDisplay: links ? getComputedStyle(links).display : 'missing',
            brand: rect(brand),
            actions: rect(actions),
            toggleDisplay: toggle ? getComputedStyle(toggle).display : 'missing',
            viewport: document.documentElement.clientWidth
          };
        });
        const drawerExpected = size.width <= 800;
        const headerOk = headerState.position === 'sticky' &&
          !!headerState.header && headerState.header.left >= -1 &&
          headerState.header.right <= headerState.viewport + 1 &&
          !!headerState.nav && headerState.nav.left >= -1 &&
          headerState.nav.right <= headerState.viewport + 1 &&
          headerState.navScrollWidth <= headerState.nav.width + 2 &&
          !!headerState.brand && headerState.brand.left >= -1 &&
          headerState.brand.right <= headerState.viewport + 1 &&
          !!headerState.actions && headerState.actions.left >= -1 &&
          headerState.actions.right <= headerState.viewport + 1 &&
          (drawerExpected
            ? headerState.linksDisplay === 'none' && headerState.toggleDisplay !== 'none'
            : headerState.linksDisplay !== 'none' && headerState.toggleDisplay === 'none');
        if (!headerOk) headerFailures.push(size.name + ' (' + size.width + 'px): ' + JSON.stringify(headerState));
      }
      report('5. Mobile, tablet, desktop and TV layouts avoid horizontal overflow', failures.length === 0, failures.join('; ') || 'Tested 320, 360, 390, 768, 801, 820, 900, 1000, 1024, 1440, 1920 px');
      report('5.3. Podcast cover is square and stays top-right on mobile/tablet or right-side on desktop', coverLayoutFailures.length === 0, coverLayoutFailures.join('; ') || 'Verified 1:1 cover geometry and RTL placement at all 11 viewport widths');
      try {
        const typography = await page.evaluate(() => {
          const card = document.querySelector('.podcast-card[data-id="91001"]');
          const title = card?.querySelector('.podcast-title');
          const description = card?.querySelector('.podcast-desc');
          const image = card?.querySelector('.podcast-cover img');
          if (!card || !title || !description || !image) return { missing: true };
          const titleStyle = getComputedStyle(title);
          const descStyle = getComputedStyle(description);
          const imageStyle = getComputedStyle(image);
          return {
            missing: false,
            titlePx: parseFloat(titleStyle.fontSize),
            descriptionPx: parseFloat(descStyle.fontSize),
            imageObjectPosition: imageStyle.objectPosition,
            imageObjectFit: imageStyle.objectFit,
            titleColor: titleStyle.color,
            descriptionColor: descStyle.color
          };
        });
        const typographyOk = !typography.missing && typography.titlePx >= 17.8 &&
          typography.descriptionPx >= 15.5 &&
          /50%|center/i.test(typography.imageObjectPosition) &&
          typography.imageObjectFit === 'contain' &&
          typography.titleColor !== typography.descriptionColor;
        report('5.4. Podcast card typography is readable and artwork is centered without cropping', typographyOk, JSON.stringify(typography));
      } catch (error) {
        report('5.4. Podcast card typography is readable and artwork is centered without cropping', false, String(error.message || error));
      }
      try {
        const originalViewport = page.viewportSize();
        const widthFailures = [];
        for (const width of [320, 360, 390, 768, 820, 900]) {
          await page.setViewportSize({ width, height: 900 });
          await page.waitForTimeout(40);
          const geometry = await page.evaluate(() => {
            const card = document.querySelector('.podcast-card[data-id="91001"]');
            const cover = card?.querySelector(':scope > .podcast-cover');
            if (!card || !cover) return { missing: true };
            const cardStyle = getComputedStyle(card);
            const coverRect = cover.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();
            const innerWidth = card.clientWidth -
              parseFloat(cardStyle.paddingLeft || 0) -
              parseFloat(cardStyle.paddingRight || 0);
            return { missing: false, viewport: innerWidth, panel: cardRect.width, cover: coverRect.width,
              difference: Math.abs(coverRect.width - innerWidth) };
          });
          if (geometry.missing || geometry.difference > 2) widthFailures.push(width + 'px: ' + JSON.stringify(geometry));
        }
        if (originalViewport) await page.setViewportSize(originalViewport);
        report('5.4.1. Podcast artwork fills the panel width on tablet and mobile', widthFailures.length === 0,
          widthFailures.join('; ') || 'Artwork width matches the card inner width at 320, 360, 390, 768, 820 and 900px');
      } catch (error) {
        report('5.4.1. Podcast artwork fills the panel width on tablet and mobile', false, String(error.message || error));
      }
      try {
        const paletteAudit = await page.evaluate(() => {
          const root = document.documentElement;
          const previous = root.dataset.theme;
          const ids = ['midnight-cosmos','aurora','studio-noir','deep-ocean','royal-gold','neon-city','persian-heritage','moonlight'];
          const values = ids.map(id => {
            root.dataset.theme = id;
            const style = getComputedStyle(root);
            const card = document.querySelector('.podcast-card[data-id="91001"]');
            const title = card?.querySelector('.podcast-title');
            const desc = card?.querySelector('.podcast-desc');
            return {
              id,
              bg: style.getPropertyValue('--nc-theme-bg').trim(),
              surface: style.getPropertyValue('--nc-theme-surface').trim(),
              text: style.getPropertyValue('--nc-theme-text').trim(),
              muted: style.getPropertyValue('--nc-theme-muted').trim(),
              divider: style.getPropertyValue('--nc-theme-divider').trim(),
              titleColor: title ? getComputedStyle(title).color : '',
              descColor: desc ? getComputedStyle(desc).color : ''
            };
          });
          root.dataset.theme = previous || 'midnight-cosmos';
          const distinct = key => new Set(values.map(v => v[key])).size;
          const valid = values.every(v => v.bg && v.surface && v.text && v.muted && v.divider &&
            v.titleColor && v.descColor && v.titleColor !== v.descColor) &&
            distinct('bg') === ids.length && distinct('text') >= 1;
          return { valid, themes: values, uniqueBackgrounds: distinct('bg'), uniqueSurfaces: distinct('surface'), uniqueTextPalettes: distinct('text'), uniqueMutedPalettes: distinct('muted') };
        });
        const paletteOk = paletteAudit.valid && paletteAudit.uniqueBackgrounds === 8 &&
          paletteAudit.uniqueSurfaces >= 7 && paletteAudit.uniqueMutedPalettes >= 7;
        report('5.5. All eight themes provide distinct panel and readable text palettes', paletteOk, JSON.stringify(paletteAudit));
      } catch (error) {
        report('5.5. All eight themes provide distinct panel and readable text palettes', false, String(error.message || error));
      }
      report('5.1. Header, navigation and controls fit across breakpoints', headerFailures.length === 0, headerFailures.join('; ') || 'Header geometry and navigation mode passed at 11 viewport widths');
      report('5.2. Welcome hero is absent across breakpoints', heroTitleFailures.length === 0, heroTitleFailures.join('; ') || 'Welcome hero is absent at all 11 viewport widths');
      report('6. Mobile navigation drawer remains fixed and usable', mobileNavigationPassed, mobileNavigationDetail);

      try {
        await page.locator('[data-nc-view="galaxy"]').click();
        await page.waitForSelector('#ncConstellation .nc-planet', { state: 'visible', timeout: 5000 });
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        const motion = await page.evaluate(() => {
          const style = (selector, pseudo) => {
            const element = document.querySelector(selector);
            return element ? getComputedStyle(element, pseudo || null).animationName : 'missing';
          };
          return {
            shootingStar: style('.nc-constellation-stage', '::before'),
            orbit: style('.nc-constellation-orbit.nc-orbit-one'),
            planet: style('.nc-planet'),
            world: style('.nc-planet-body'),
            ring: style('.nc-planet-body', '::before'),
            glow: style('.nc-planet-glow')
          };
        });
        const motionOk = motion.shootingStar === 'ncShootingStar' && motion.orbit === 'ncOrbitSlowOne' && motion.planet === 'ncPlanetBob' && motion.world === 'ncWorldHover' && motion.ring === 'ncRingPrecession' && motion.glow === 'ncGlowPulse';
        report('7. Galaxy motion layers are active when motion is allowed', motionOk, JSON.stringify(motion));
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const reduced = await page.evaluate(() => ({
          orbit: getComputedStyle(document.querySelector('.nc-constellation-orbit.nc-orbit-one')).animationName,
          planet: getComputedStyle(document.querySelector('.nc-planet')).animationName
        }));
        report('7.1 Reduced-motion preference disables decorative orbital motion', reduced.orbit === 'none' && reduced.planet === 'none', JSON.stringify(reduced));
      } catch (motionError) {
        report('7. Galaxy motion layers are active when motion is allowed', false, String(motionError.message || motionError));
      }
    } catch (error) {
      report('5. Mobile, tablet, desktop and TV layouts avoid horizontal overflow', false, String(error.message || error));
    }
  } catch (error) {
    console.error('Test runner error:', error);
  } finally {
    if (pageForCoverage && cssCoverageStarted) {
      try {
        const entries = await pageForCoverage.coverage.stopCSSCoverage();
        const localEntries = entries.filter(entry => entry.url.startsWith('http://127.0.0.1:4173/'));
        const fileStats = localEntries.map(entry => {
          const usedBytes = (entry.ranges || []).reduce((sum, range) => sum + Math.max(0, range.end - range.start), 0);
          const totalBytes = entry.text.length;
          return {
            file: new URL(entry.url).pathname,
            totalBytes,
            usedBytes: Math.min(totalBytes, usedBytes),
            unusedBytes: Math.max(0, totalBytes - usedBytes),
            unusedPercent: totalBytes ? Math.round((Math.max(0, totalBytes - usedBytes) / totalBytes) * 100) : 0
          };
        }).sort((a, b) => b.unusedBytes - a.unusedBytes);
        const totalBytes = fileStats.reduce((sum, item) => sum + item.totalBytes, 0);
        const usedBytes = fileStats.reduce((sum, item) => sum + item.usedBytes, 0);
        report('9. CSS usage coverage across browser journeys', totalBytes > 0,
          JSON.stringify({
            measuredLocalStylesheets: fileStats.length,
            totalCssBytes: totalBytes,
            usedCssBytes: usedBytes,
            unusedCssBytes: Math.max(0, totalBytes - usedBytes),
            unusedPercent: totalBytes ? Math.round((Math.max(0, totalBytes - usedBytes) / totalBytes) * 100) : 0,
            largestUnusedFiles: fileStats.slice(0, 8)
          }));
      } catch (coverageError) {
        report('9. CSS usage coverage across browser journeys', false, String(coverageError.message || coverageError));
      }
    }
    if (browser) await browser.close().catch(() => {});
    if (server) {
      server.kill('SIGTERM');
      if (server.stdout) server.stdout.destroy();
      if (server.stderr) server.stderr.destroy();
    }
  }

  report('8. No uncaught JavaScript runtime errors', runtimeErrors.length === 0,
    runtimeErrors.slice(0, 10).join(' || ') || 'No uncaught page errors or actionable console errors');

  // Android APK build is intentionally not used as a website quality criterion.
  const failed = results.filter(item => !item.passed);
  console.log('SUMMARY | ' + results.filter(item => item.passed).length + '/' + results.length + ' browser/API checks TRUE');
  if (process.env.GITHUB_STEP_SUMMARY) {
    const nl = String.fromCharCode(10);
    const rows = results.map(item =>
      '| ' + item.name.split('|').join('/') + ' | **' +
      (item.passed ? 'TRUE' : 'FALSE') + '** | ' +
      String(item.detail || '').split(nl).join(' ').split('|').join(' ').slice(0, 220) + ' |'
    ).join(nl);
    const summary = [
      '## Browser and API acceptance results',
      '',
      '| Activity | Result | Details |',
      '|---|---|---|',
      rows,
      ''
    ].join(nl);
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
  if (failed.length) process.exitCode = 1;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
