'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { setTimeout: sleep } = require('node:timers/promises');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const deadline = Date.now() + 5 * 60 * 1000;
  let livePage = null;
  let lastTransientError = null;
  let runtimeErrors = [];

  try {
    while (Date.now() < deadline && !livePage) {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
        serviceWorkers: 'block'
      });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));

      try {
        const url = 'https://nightcast.ir/?nc_live_browser_check=' + Date.now();
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        assert(response && response.ok(), 'Production root did not return a successful HTTP response');
        assert.equal(new URL(page.url()).pathname, '/', 'Production entry navigated away from the canonical root');

        await page.waitForSelector('#podcastGrid', { state: 'attached', timeout: 15000 });
        assert.equal(await page.locator('#heroTitle, main .hero').count(), 0, 'Live root still contains the welcome hero');
        assert.equal(await page.locator('main > #podcasts').count(), 1, 'Live root must begin its main content with the podcast archive');
        await page.waitForFunction(() => {
          const loader = document.getElementById('nc-entry-loader');
          return !loader || loader.classList.contains('is-hidden');
        }, null, { timeout: 90000 });

        const cards = page.locator('#podcastGrid .podcast-card');
        const cardCount = await cards.count();
        assert.equal(cardCount, 6,
          'The first archive page must render exactly six podcast cards; got ' + cardCount);

        const pagination = page.locator('#ncPodcastPagination');
        await pagination.waitFor({ state: 'visible', timeout: 10000 });
        const pageTwo = pagination.locator('button[data-page="2"]');
        assert.equal(await pageTwo.count(), 1,
          'A second page button must be available when the catalogue exceeds six records');

        const firstPageIds = await cards.evaluateAll(items => items.map(card => card.dataset.id || card.querySelector('[data-podcast-id]')?.dataset.podcastId || card.textContent.trim()));
        await pageTwo.click();
        await page.waitForFunction(previous => {
          const current = Array.from(document.querySelectorAll('#podcastGrid .podcast-card'))
            .map(card => card.dataset.id || card.querySelector('[data-podcast-id]')?.dataset.podcastId || card.textContent.trim());
          const active = document.querySelector('#ncPodcastPagination button[data-page="2"][aria-current="page"]');
          return !!active && current.length === 6 && current.some((id, index) => id !== previous[index]);
        }, firstPageIds, { timeout: 10000 });
        const secondPageCount = await cards.count();
        assert.equal(secondPageCount, 6, 'Page two must also render six aligned podcast cards');

        livePage = page;
        runtimeErrors = errors;
        console.log('PASS | Live www entry, loader and six-card pagination | page1=' + cardCount + ', page2=' + secondPageCount + ', URL=' + page.url());
      } catch (error) {
        await page.close().catch(() => {});
        if (error.fatal) throw error;
        lastTransientError = error;
        console.log('RETRY | Live entry is not ready yet | ' + (error.message || error));
        await sleep(15000);
      }
    }

    if (!livePage) {
      throw new Error('Live www entry did not become ready within five minutes: ' + (lastTransientError?.message || 'unknown error'));
    }

    assert.deepEqual(runtimeErrors, [], 'Uncaught JavaScript errors on the live entry: ' + runtimeErrors.join(' | '));

    const layout = [];
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await livePage.setViewportSize({ width, height: width >= 1440 ? 900 : 844 });
      await livePage.waitForTimeout(120);
      const metrics = await livePage.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        cards: document.querySelectorAll('#podcastGrid .podcast-card').length,
        loaderVisible: (() => {
          const loader = document.getElementById('nc-entry-loader');
          return !!loader && !loader.classList.contains('is-hidden') && getComputedStyle(loader).visibility !== 'hidden';
        })()
      }));
      assert(metrics.document <= metrics.viewport + 1 && metrics.body <= metrics.viewport + 1,
        'Horizontal overflow at ' + width + 'px: ' + JSON.stringify(metrics));
      assert.equal(metrics.loaderVisible, false, 'Galaxy loader remained visible after catalogue readiness at ' + width + 'px');
      layout.push({ width, cards: metrics.cards, documentWidth: metrics.document, bodyWidth: metrics.body });
    }

    console.log('PASS | Live www responsive widths | ' + JSON.stringify(layout));
    console.log('PASS | Live www browser smoke | loader dismissed after catalogue render; no horizontal overflow or uncaught JS errors.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error('FAIL | Live www browser smoke | ' + (error.stack || error.message || error));
  process.exitCode = 1;
});
