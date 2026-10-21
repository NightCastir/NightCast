const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = process.cwd();
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp'
};

const fixture = {
  success: true,
  total: 2,
  podcasts: [
    { id: 77101, title: 'آزمایش پادکست اول', book_name: 'کتاب آزمایشی', author_name: 'NightCast TV CI',
      category_name: 'آزمایش', description: 'توضیحات آزمایشی', short_description: 'توضیح کوتاه',
      summary: 'خلاصه آزمایشی', transcript: 'متن آزمایشی', audio_url: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      cover_url: '/assets/icons/icon-512.png', duration_seconds: 1, tags: ['آزمایش'], status: 'active' },
    { id: 77102, title: 'آزمایش پادکست دوم', book_name: 'کتاب دوم', author_name: 'NightCast TV CI',
      category_name: 'فرهنگ', description: 'توضیحات آزمایشی دوم', short_description: 'توضیح کوتاه دوم',
      summary: 'خلاصه دوم', transcript: 'متن دوم', audio_url: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      cover_url: '/assets/icons/icon-512.png', duration_seconds: 1, tags: ['فرهنگ'], status: 'active' }
  ]
};

function serveFile(requestPath, response) {
  let pathname = decodeURIComponent(requestPath.split('?')[0]);
  if (pathname === '/about' || pathname === '/about/') pathname = '/about/index.html';
  if (pathname === '/contact' || pathname === '/contact/') pathname = '/contact/index.html';
  if (pathname.endsWith('/')) pathname += 'index.html';
  const resolved = path.resolve(root, '.' + pathname);
  if (!resolved.startsWith(root + path.sep) && resolved !== path.join(root, 'index.html')) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(resolved, (error, data) => {
    if (error) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found: ' + pathname);
      return;
    }
    response.writeHead(200, { 'content-type': mime[path.extname(resolved).toLowerCase()] || 'application/octet-stream' });
    response.end(data);
  });
}

(async () => {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.hostname === '127.0.0.1' && url.pathname === '/__health') {
      response.writeHead(200).end('ok');
      return;
    }
    serveFile(url.pathname + url.search, response);
  });

  let browser;
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(4174, '127.0.0.1', resolve);
    });
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block'
    });
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await page.route('https://nightcast-shield.tomasgermany2580.workers.dev/**', async route => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname.endsWith('/public/podcasts')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) });
      }
      if (pathname.endsWith('/public/podcasts/stats')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, total: 2, stats: {} }) });
      }
      if (pathname.endsWith('/auth/status')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, authenticated: false }) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, comments: [], favorites: [], data: [] }) });
    });
    await page.route('https://nightcast.ir/data/podcasts.json**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) }));
    await page.route('https://www.nightcast.ir/data/podcasts.json**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) }));

    const checks = [
      { path: '/', id: 'podcasts', label: 'podcast archive' },
      { path: '/about', id: 'about', label: 'About Us' },
      { path: '/contact', id: 'contact', label: 'Contact Us' }
    ];
    let failed = false;
    for (const check of checks) {
      try {
        await page.goto('http://127.0.0.1:4174' + check.path, { waitUntil: 'domcontentloaded', timeout: 12000 });
        await page.waitForFunction(({ expectedPath, id }) => {
          const path = location.pathname.replace(/\/+$/, '') || '/';
          const section = document.getElementById(id);
          if (path !== expectedPath || !section || !document.querySelector('#podcastGrid')) return false;
          if (expectedPath === '/') return document.querySelectorAll('#podcastGrid .podcast-card').length > 0;
          const rect = section.getBoundingClientRect();
          return !section.hidden && getComputedStyle(section).display !== 'none' &&
            rect.top < window.innerHeight * 0.9 && rect.bottom > 0;
        }, { expectedPath: check.path, id: check.id }, { timeout: 12000 });
        const state = await page.evaluate(id => {
          const section = document.getElementById(id);
          const rect = section.getBoundingClientRect();
          return {
            path: location.pathname,
            sectionTop: Math.round(rect.top),
            viewport: window.innerWidth + 'x' + window.innerHeight,
            podcastCards: document.querySelectorAll('#podcastGrid .podcast-card').length
          };
        }, check.id);
        console.log('PASS | simulated TV navigation | ' + check.label + ' | ' + JSON.stringify(state));
      } catch (error) {
        console.log('FAIL | simulated TV navigation | ' + check.label + ' | ' + error.message);
        failed = true;
      }
    }
    if (runtimeErrors.length) {
      console.log('FAIL | simulated TV JavaScript runtime | ' + runtimeErrors.join(' || '));
      failed = true;
    } else {
      console.log('PASS | simulated TV JavaScript runtime | no uncaught errors');
    }
    console.log('SUMMARY | TV route checks ' + (failed ? 'FAILED' : 'PASSED'));
    if (failed) process.exitCode = 1;
  } catch (error) {
    console.error('TV simulation setup failed:', error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})();
