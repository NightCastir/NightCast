const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');

const results = [];
function report(name, passed, detail = '') {
  const value = Boolean(passed);
  results.push({ name, passed: value, detail });
  console.log((value ? 'TRUE' : 'FALSE') + ' | ' + name + (detail ? ' | ' + detail : ''));
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
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
  try {
    // Activity 2: validate the actual public API, independently of browser mocks.
    try {
      const response = await fetch('https://nightcast-api.tomasgermany2580.workers.dev/api/v1/public/podcasts?page=1&limit=5', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12000)
      });
      const payload = await response.json();
      const ok = response.ok && payload?.success === true && Array.isArray(payload.podcasts) && payload.podcasts.length > 0;
      report('2. Real podcast API returns live records', ok, 'HTTP ' + response.status + ', records=' + (payload?.podcasts?.length ?? 'n/a'));
    } catch (error) {
      report('2. Real podcast API returns live records', false, String(error.message || error));
    }

    server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1'], {
      stdio: 'ignore',
      detached: false
    });
    let serverReady = false;
    for (let i = 0; i < 40; i++) {
      try {
        const response = await fetch('http://127.0.0.1:4173/index.html', { signal: AbortSignal.timeout(500) });
        if (response.ok) { serverReady = true; break; }
      } catch {}
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
    const browserErrors = [];
    page.on('pageerror', error => browserErrors.push('pageerror: ' + error.message));
    page.on('requestfailed', request => browserErrors.push('requestfailed: ' + request.url() + ' ' + (request.failure()?.errorText || '')));
    page.on('console', message => { if (message.type() === 'error') browserErrors.push('console: ' + message.text()); });
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
      }
    ];

    await page.route('https://nightcast-api.tomasgermany2580.workers.dev/**', async route => {
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
    await page.route('https://www.nightcast.ir/version.json**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ version: '4.1.0' }) }));
    await page.route(/https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|unpkg\.com)\//, route => route.abort());

    // Activity 1: splash exits and the app reaches the archive.
    let splashOk = false;
    try {
      await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForURL('**/users/index.html', { timeout: 10000 });
      await page.waitForSelector('#podcastGrid', { state: 'attached', timeout: 5000 });
      splashOk = true;
      report('1. Splash transitions to the home/archive page', true, new URL(page.url()).pathname);
    } catch (error) {
      report('1. Splash transitions to the home/archive page', false, String(error.message || error));
    }

    // The archive uses cinematic page navigation: open the Podcasts page before testing its cards.
    try {
      await page.locator('.nc-nav .nav-link[href="#podcasts"]').click();
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
      report('3. Selecting a planet opens the matching podcast details', true);
    } catch (error) {
      report('3. Selecting a planet opens the matching podcast details', false, String(error.message || error));
    }

    // Activity 4: verify search, player state, favorite mutation and comments entry.
    try {
      await page.locator('[data-action="close-details"]').first().click().catch(() => {});
      const search = page.locator('#searchInput');
      await search.fill('سیاره آزمایشی اول');
      await page.waitForFunction(() => document.querySelectorAll('#podcastGrid .podcast-card').length === 1);
      assert(await page.locator('#podcastGrid .podcast-card').first().getAttribute('data-id') === '91001', 'Search returned the wrong record');
      await search.fill('');
      await page.waitForFunction(() => document.querySelectorAll('#podcastGrid .podcast-card').length === 2);

      await page.locator('.podcast-card[data-id="91001"] [data-action="play"]').click();
      await page.waitForSelector('#playerBar.show', { timeout: 5000 });
      assert((await page.locator('#playerTitle').innerText()).includes('سیاره آزمایشی اول'), 'Player title does not match selected podcast');
      const audio = page.locator('audio').first();
      await page.waitForFunction(() => {
        const el = document.querySelector('audio');
        return !!el && !!el.src && el.readyState >= 2 && !el.paused;
      }, undefined, { timeout: 5000 });
      const audioState = await page.locator('audio').evaluate(el => ({ paused: el.paused, readyState: el.readyState }));
      assert(audioState.readyState >= 2 && audioState.paused === false, 'Audio did not enter playing state');
      await page.locator('#playButton').click();
      await page.waitForFunction(() => document.querySelector('audio')?.paused === true, undefined, { timeout: 5000 });

      await page.locator('.podcast-card[data-id="91001"] [data-action="favorite"]').click();
      await page.waitForFunction(() => document.querySelector('.podcast-card[data-id="91001"] [data-action="favorite"]')?.getAttribute('aria-pressed') === 'true', undefined, { timeout: 3000 });

      await page.locator('.podcast-card[data-id="91001"] [data-action="comments"]').click();
      await page.waitForFunction(() => {
        const modal = document.querySelector('#ncCommentsModal');
        return modal && modal.classList.contains('open') && modal.getAttribute('aria-hidden') === 'false';
      }, undefined, { timeout: 3000 });
      assert((await page.locator('#ncCommentsPodcastTitle').innerText()).includes('سیاره آزمایشی اول'), 'Comments opened for the wrong podcast');
      report('4. Search, play/pause, favorites and comments work', true, 'Search, audio readiness/pause, favorite state and comments dialog verified');
    } catch (error) {
      report('4. Search, player, favorites and comments controls work', false, String(error.message || error));
    }

    // Activity 5: measure overflow at phone, tablet, desktop and TV viewports.
    try {
      const sizes = [
        { name: 'mobile', width: 390, height: 844 },
        { name: 'tablet', width: 820, height: 1180 },
        { name: 'desktop', width: 1440, height: 1000 },
        { name: 'TV', width: 1920, height: 1080 }
      ];
      const failures = [];
      for (const size of sizes) {
        await page.setViewportSize({ width: size.width, height: size.height });
        await page.waitForTimeout(120);
        const dims = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
        }));
        if (dims.content > dims.viewport + 3) failures.push(size.name + ': ' + dims.content + 'px > ' + dims.viewport + 'px');
      }
      report('5. Mobile, tablet, desktop and TV layouts avoid horizontal overflow', failures.length === 0, failures.join('; ') || '390, 820, 1440, 1920 px');
    } catch (error) {
      report('5. Mobile, tablet, desktop and TV layouts avoid horizontal overflow', false, String(error.message || error));
    }
  } catch (error) {
    console.error('Test runner error:', error);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) {
      server.kill('SIGTERM');
      if (server.stdout) server.stdout.destroy();
      if (server.stderr) server.stderr.destroy();
    }
  }

  // The sixth acceptance gate is the Android build job in build-android.yml.
  console.log('INFO | 6. Android APK build | reported separately by Build NightCast Android APK workflow');
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
