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
        const url = 'https://www.nightcast.ir/?nc_live_browser_check=' + Date.now();
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        assert(response && response.ok(), 'Production root did not return a successful HTTP response');
        assert.equal(new URL(page.url()).pathname, '/', 'Production entry navigated away from the canonical root');

        await page.waitForSelector('#podcastGrid', { state: 'attached', timeout: 15000 });
        await page.waitForFunction(() => {
          const loader = document.getElementById('nc-entry-loader');
          return !loader || loader.classList.contains('is-hidden');
        }, null, { timeout: 90000 });

        const cardCount = await page.locator('#podcastGrid .podcast-card').count();
        if (cardCount < 20) {
          const error = new Error('Galaxy loader dismissed but only ' + cardCount + ' podcast cards rendered; expected at least 20 records in the full catalogue.');
          error.fatal = true;
          throw error;
        }

        livePage = page;
        runtimeErrors = errors;
        console.log('PASS | Live www entry and loader readiness | cards=' + cardCount + ', URL=' + page.url());
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
