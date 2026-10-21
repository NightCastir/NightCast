'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
fs.mkdirSync('artifacts', { recursive: true });

const BASE = process.env.NIGHTCAST_BASE_URL || 'https://nightcast.ir';
const API_URL = process.env.NIGHTCAST_API_URL || 'https://nightcast-shield.tomasgermany2580.workers.dev/api/v1/public/podcasts?page=1&limit=5';
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''));
}
async function waitForPodcastCards(page) {
  const grid = page.locator('#podcastGrid');
  await grid.waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForFunction(() => {
    const grid = document.querySelector('#podcastGrid');
    return !!grid && (grid.children.length > 0 || /خطا|دوباره|پادکستی یافت نشد/i.test(grid.textContent || ''));
  }, { timeout: 25000 }).catch(() => {});
  return { count: await grid.locator(':scope > *').count(), text: (await grid.innerText().catch(() => '')).slice(0, 160) };
}
(async () => {
  let browser;
  const runtimeErrors = [];
  try {
    browser = await chromium.launch({ headless: true });
    const api = await fetch(API_URL, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    let records = [];
    let payload = {};
    if (api.ok) {
      payload = await api.json();
      records = Array.isArray(payload.podcasts) ? payload.podcasts : (Array.isArray(payload.data) ? payload.data : []);
    }
    check('Live D1-backed podcast API responds with valid data', api.ok && payload.success === true && records.length > 0,
      'HTTP ' + api.status + '; records=' + records.length + '; total=' + (payload.total ?? 'unknown'));

    const fallback = await fetch(BASE + '/users/data/podcasts.json', { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    let fallbackPayload = {};
    if (fallback.ok) fallbackPayload = await fallback.json();
    const fallbackRecords = Array.isArray(fallbackPayload.podcasts) ? fallbackPayload.podcasts : [];
    check('Static podcast fallback is reachable', fallback.ok && fallbackRecords.length > 0,
      'HTTP ' + fallback.status + '; records=' + fallbackRecords.length);

    const liveAppResponse = await fetch(BASE + '/js/nightcast-app.js?v=2&tv-compat-check=' + Date.now(), {
      headers: { accept: 'text/javascript' }, signal: AbortSignal.timeout(15000)
    });
    const liveAppSource = liveAppResponse.ok ? await liveAppResponse.text() : '';
    const liveFallbackUpdated = liveAppResponse.ok &&
      liveAppSource.includes('"/users/data/podcasts.json"') &&
      !liveAppSource.includes('https://nightcast.ir/data/podcasts.json');
    check('Published app bundle points to the reachable static fallback', liveFallbackUpdated,
      'HTTP ' + liveAppResponse.status + '; updatedFallback=' + liveFallbackUpdated);

    const sizes = [
      { name: 'TV-1080p', width: 1920, height: 1080 },
      { name: 'TV-720p', width: 1280, height: 720 },
      { name: 'Desktop', width: 1365, height: 768 },
      { name: 'Tablet', width: 1024, height: 768 },
      { name: 'Mobile', width: 360, height: 800 }
    ];
    for (const size of sizes) {
      const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      page.on('pageerror', error => runtimeErrors.push(size.name + ': ' + error.message));
      const response = await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      check(size.name + ' homepage responds', !!response && response.status() < 400, 'HTTP ' + (response && response.status()));
      const gridResult = await waitForPodcastCards(page).catch(error => ({ count: 0, text: error.message }));
      check(size.name + ' podcasts render', gridResult.count > 0,
        'cards=' + gridResult.count + (gridResult.text ? '; ' + gridResult.text.replace(/\s+/g, ' ') : ''));
      const overflow = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        body: document.body.scrollWidth
      }));
      check(size.name + ' no horizontal page overflow',
        overflow.scroll <= overflow.viewport + 2 && overflow.body <= overflow.viewport + 2,
        JSON.stringify(overflow));
      await page.screenshot({ path: 'artifacts/nightcast-' + size.name.toLowerCase() + '.png', fullPage: false }).catch(() => {});
      await context.close();
    }

    for (const route of ['about', 'contact']) {
      const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
      const page = await context.newPage();
      page.on('pageerror', error => runtimeErrors.push(route + ': ' + error.message));
      const response = await page.goto(BASE + '/' + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const target = page.locator('#' + route);
      await target.waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const sectionState = await target.evaluate(node => {
        const rect = node.getBoundingClientRect();
        return { visible: !!(rect.width && rect.height) && getComputedStyle(node).visibility !== 'hidden' && getComputedStyle(node).display !== 'none',
          top: Math.round(rect.top), bottom: Math.round(rect.bottom), viewport: window.innerHeight,
          hidden: node.hidden, ariaHidden: node.getAttribute('aria-hidden') };
      }).catch(() => ({ visible: false, top: null, bottom: null, viewport: 0, hidden: true, ariaHidden: null }));
      const sectionInViewport = sectionState.visible && sectionState.top < sectionState.viewport && sectionState.bottom > 0 && sectionState.top < 300;
      check('/' + route + ' opens its intended section at the viewport', !!response && response.status() < 400 && sectionInViewport,
        'HTTP ' + (response && response.status()) + '; section=' + JSON.stringify(sectionState) + '; finalURL=' + page.url());
      await page.screenshot({ path: 'artifacts/nightcast-route-' + route + '.png', fullPage: false }).catch(() => {});
      await context.close();
    }
    check('No uncaught browser JavaScript errors', runtimeErrors.length === 0, runtimeErrors.slice(0, 8).join(' || ') || 'none');
  } catch (error) {
    check('TV compatibility test runner completed', false, error.stack || error.message);
  } finally {
    if (browser) await browser.close();
  }
  const failed = results.filter(result => !result.ok);
  console.log('SUMMARY | ' + (results.length - failed.length) + '/' + results.length + ' checks passed');
  if (failed.length) process.exitCode = 1;
})();
