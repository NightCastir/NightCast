'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const SITE = 'https://nightcast.ir';
const API = 'https://nightcast-api.tomasgermany2580.workers.dev/api/v1/public/podcasts?page=1&limit=1';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const apiResponse = await fetch(API, { signal: AbortSignal.timeout(15000) });
    assert(apiResponse.ok, 'Public podcast API must be reachable');
    const apiData = await apiResponse.json();
    const records = Array.isArray(apiData) ? apiData : (apiData.data || apiData.podcasts || apiData.items || apiData.results || []);
    const total = apiData.total ?? apiData.pagination?.total ?? apiData.meta?.total ?? records.length;
    assert(Number(total) >= 20, 'Expected full podcast catalogue, API reports ' + total);

    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(SITE + '/?nc_tv_acceptance=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 45000 });
    assert(response && response.ok(), 'Homepage must return HTTP success');
    assert.equal(new URL(page.url()).pathname, '/', 'TV must remain on the full homepage, not a lite route');
    await page.waitForSelector('#podcastGrid .podcast-card', { timeout: 60000 });
    await page.waitForFunction(() => {
      const loader = document.getElementById('nc-entry-loader');
      return !loader || loader.classList.contains('is-hidden');
    }, null, { timeout: 90000 });

    const initial = await page.evaluate(() => ({
      cards: document.querySelectorAll('#podcastGrid .podcast-card').length,
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      title: document.title,
      hasPlayer: !!document.querySelector('#playerBar #playButton'),
      nav: [...document.querySelectorAll('.nc-nav .nav-link')].filter(a => a.offsetWidth || a.offsetHeight).length,
      liteRedirect: /tv-lite\.html/i.test(document.documentElement.innerHTML)
    }));
    assert(initial.cards > 0, 'TV layout must render podcast cards');
    assert(initial.documentWidth <= initial.viewport + 1 && initial.bodyWidth <= initial.viewport + 1,
      'TV layout has horizontal overflow: ' + JSON.stringify(initial));
    assert(initial.hasPlayer, 'Full player controls must exist on TV');
    assert(initial.nav >= 3, 'Full desktop navigation must remain available on TV');
    assert.equal(initial.liteRedirect, false, 'Homepage must not contain the reduced tv-lite redirect');

    // Exercise keyboard focus like a TV remote.
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => !!document.activeElement && document.activeElement !== document.body);
    assert(focused, 'Keyboard/remote focus must work');

    // Verify all major full-site viewports using the same page.
    const layouts = [];
    for (const viewport of [
      { width: 1280, height: 800 },
      { width: 768, height: 1024 },
      { width: 390, height: 844 }
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(250);
      const metrics = await page.evaluate(() => ({
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        cards: document.querySelectorAll('#podcastGrid .podcast-card').length
      }));
      assert(metrics.documentWidth <= metrics.width + 1 && metrics.bodyWidth <= metrics.width + 1,
        'Responsive overflow at ' + viewport.width + ': ' + JSON.stringify(metrics));
      assert(metrics.cards > 0, 'Podcast cards disappeared at viewport ' + viewport.width);
      layouts.push(metrics);
    }

    // Check mobile drawer open/close without replacing the page with a lite version.
    await page.setViewportSize({ width: 390, height: 844 });
    const menu = page.locator('#ncMenuToggle');
    if (await menu.isVisible()) {
      await menu.click();
      await page.waitForTimeout(150);
      const expanded = await menu.getAttribute('aria-expanded');
      assert.equal(expanded, 'true', 'Mobile navigation button should open the full navigation drawer');
      const drawerClose = page.locator('#ncDrawerClose');
      if (await drawerClose.isVisible()) await drawerClose.click();
      else await page.keyboard.press('Escape');
      await page.waitForTimeout(350);
      assert.equal(await menu.getAttribute('aria-expanded'), 'false', 'Mobile navigation should close cleanly');
    }

    assert.deepEqual(errors, [], 'Uncaught JavaScript errors: ' + errors.join(' | '));
    console.log('PASS | TV viewport 1920x1080 | ' + JSON.stringify(initial));
    console.log('PASS | responsive desktop/tablet/mobile | ' + JSON.stringify(layouts));
    console.log('PASS | API catalogue total=' + total + ', player present, remote keyboard focus, navigation and no lite redirect');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error('FAIL | NightCast full-experience TV acceptance | ' + (error.stack || error.message || error));
  process.exitCode = 1;
});
