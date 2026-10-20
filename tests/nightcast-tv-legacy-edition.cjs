'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = process.cwd();
const API = 'https://nightcast-api.tomasgermany2580.workers.dev/api/v1/public/podcasts?page=1&limit=1';
const API = 'https://nightcast-api.tomasgermany2580.workers.dev/api/v1/public/podcasts?page=1&limit=1';

async function main() {
  const source = fs.readFileSync('tv-lite.html', 'utf8');
  const homeSource = fs.readFileSync('index.html', 'utf8');
  assert(homeSource.indexOf('NC_LEGACY_TV_FALLBACK') >= 0, 'Homepage must include conditional legacy Android TV detection');
  const detectorStart = homeSource.indexOf('NC_LEGACY_TV_FALLBACK');
  const detector = homeSource.slice(detectorStart, homeSource.indexOf('</script>', detectorStart));
  assert(!/=>|\?\.|\?\?|\b(?:const|let)\s/.test(detector), 'Early TV detector must be parseable by legacy JavaScript engines');
  const scripts = Array.from(source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)).map(function (m) { return m[1]; }).join('\n');
  assert(!/\?\.|\?\?|=>|\b(?:const|let)\s/.test(scripts), 'TV page inline JavaScript must stay ES5-compatible');

  const api = await fetch(API, { signal: AbortSignal.timeout(15000) });
  assert(api.ok, 'Public podcast API must return success');
  const apiData = await api.json();
  const rows = Array.isArray(apiData) ? apiData : (apiData.data || apiData.podcasts || apiData.items || apiData.results || []);
  const total = apiData.total || (apiData.pagination && apiData.pagination.total) || (apiData.meta && apiData.meta.total) || rows.length;
  assert(Number(total) >= 20, 'Expected full catalogue, got ' + total);

  const server = http.createServer(function (req, res) {
    var pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname); } catch (e) { res.writeHead(400); res.end(); return; }
    var filename = path.resolve(ROOT, '.' + pathname);
    if (filename.indexOf(ROOT + path.sep) !== 0) { res.writeHead(403); res.end(); return; }
    fs.readFile(filename, function (error, body) {
      if (error) { res.writeHead(404); res.end('Not found'); return; }
      var ext = path.extname(filename).toLowerCase();
      var types = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    });
  });
  await new Promise(function (resolve, reject) { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const site = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
    page.on('pageerror', function (error) { errors.push(error.message); });
    const response = await page.goto(site + '/tv-lite.html?nc_tv_acceptance=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
    assert(response && response.ok(), 'TV edition must return HTTP success');
    await page.waitForFunction(function () {
      var list = document.getElementById('podcast-list');
      return list && list.querySelectorAll('.card').length > 0;
    }, null, { timeout: 45000 });

    const desktop = await page.evaluate(function () {
      var cards = Array.prototype.slice.call(document.querySelectorAll('#podcast-list .card'));
      var rects = cards.map(function (card) { var r = card.getBoundingClientRect(); return { top: Math.round(r.top), height: Math.round(r.height), width: Math.round(r.width) }; });
      return {
        cards: cards.length,
        columns: getComputedStyle(document.getElementById('podcast-list')).gridTemplateColumns.split(' ').length,
        cardHeights: rects.slice(0, 4).map(function (r) { return r.height; }),
        documentWidth: document.documentElement.scrollWidth,
        viewport: innerWidth,
        player: !!document.querySelector('#audio[controls]'),
        nav: document.querySelectorAll('nav [data-section]').length,
        title: document.title
      };
    });
    assert(desktop.cards >= 20, 'TV archive should render at least 20 podcast cards, got ' + desktop.cards);
    assert(desktop.columns >= 3, 'Large TV should show a multi-column aligned card grid');
    assert(desktop.cardHeights.every(function (h) { return h === desktop.cardHeights[0]; }), 'First row podcast cards must have equal height: ' + JSON.stringify(desktop.cardHeights));
    assert(desktop.documentWidth <= desktop.viewport + 1, 'TV page must not overflow horizontally');
    assert(desktop.player, 'Audio player must be visible and available');
    assert(desktop.nav >= 3, 'Podcasts, About and Contact navigation must be present');

    await page.locator('nav [data-section="about"]').click();
    assert.equal(await page.locator('#view-about').isVisible(), true, 'About navigation must work');
    await page.locator('nav [data-section="contact"]').click();
    assert.equal(await page.locator('#view-contact').isVisible(), true, 'Contact navigation must work');
    await page.locator('nav [data-section="podcasts"]').click();
    assert.equal(await page.locator('#view-podcasts').isVisible(), true, 'Archive navigation must work');

    const layouts = [];
    for (const viewport of [{ width: 1280, height: 720 }, { width: 900, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      const m = await page.evaluate(function () {
        return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, cards: document.querySelectorAll('#podcast-list .card').length, columns: getComputedStyle(document.getElementById('podcast-list')).gridTemplateColumns.split(' ').length };
      });
      assert(m.documentWidth <= m.width + 1, 'Overflow at ' + viewport.width + ': ' + JSON.stringify(m));
      assert(m.cards >= 20, 'Archive cards disappeared at ' + viewport.width);
      layouts.push(m);
    }
    assert.deepEqual(errors, [], 'Uncaught browser errors: ' + errors.join(' | '));
    console.log('PASS | ES5 inline JavaScript | legacy TV page');
    console.log('PASS | catalogue total=' + total + ', rendered=' + desktop.cards + ', columns=' + desktop.columns + ', equal card heights=' + desktop.cardHeights.join('/') + ', player and navigation');
    console.log('PASS | responsive TV/desktop/tablet/mobile | ' + JSON.stringify(layouts));
  } finally {
    await browser.close();
    await new Promise(function (resolve) { server.close(resolve); });
  }
}

main().catch(function (error) {
  console.error('FAIL | NightCast legacy TV edition | ' + (error.stack || error.message || error));
  process.exitCode = 1;
});
