const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = 'http://127.0.0.1:4173/';
const themeIds = ['midnight-cosmos','aurora','studio-noir','deep-ocean','royal-gold','neon-city','persian-heritage','moonlight'];
const mockPodcasts = Array.from({ length: 14 }, (_, index) => ({
  id: index + 1,
  title: 'پادکست آزمایشی ' + (index + 1),
  book_name: 'کتاب آزمایشی ' + (index + 1),
  author_name: 'NightCast QA',
  category_name: 'آزمایش',
  description: 'توضیحات پادکست آزمایشی شماره ' + (index + 1),
  short_description: 'توضیح کوتاه ' + (index + 1),
  long_description: 'توضیح کامل ' + (index + 1),
  cover_url: '/assets/icons/icon-512.png',
  audio_url: '',
  duration_seconds: 120,
  publish_date: '2026-10-20'
}));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const check = (label, ok, detail = '') => {
    console.log((ok ? 'PASS' : 'FAIL') + ' | ' + label + (detail ? ' | ' + detail : ''));
    if (!ok) failures.push(label);
  };
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', error => failures.push('browser error: ' + error.message));
      await page.route('**/api/v1/public/podcasts**', async route => {
        const url = new URL(route.request().url());
        const pageNumber = Math.max(1, Number(url.searchParams.get('page')) || 1);
        const limit = Math.max(1, Number(url.searchParams.get('limit')) || 5);
        const start = (pageNumber - 1) * limit;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, total: mockPodcasts.length, podcasts: mockPodcasts.slice(start, start + limit) })
        });
      });
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForFunction(() => document.querySelectorAll('#podcastGrid .podcast-card').length === 6, null, { timeout: 20000 });

      const ids = async () => page.locator('#podcastGrid .podcast-card').evaluateAll(cards => cards.map(card => Number(card.dataset.id)));
      check('page 1 shows exactly podcast records 1–6 at ' + viewport.width + 'px',
        JSON.stringify(await ids()) === JSON.stringify([1,2,3,4,5,6]), JSON.stringify(await ids()));
      check('pagination appears directly after the podcast grid',
        await page.locator('#podcastGrid').evaluate(grid => grid.nextElementSibling?.id === 'ncPodcastPagination'));
      check('pagination is centered and theme-token driven',
        await page.evaluate(() => {
          const nav = document.getElementById('ncPodcastPagination');
          const style = getComputedStyle(nav);
          const root = getComputedStyle(document.documentElement);
          return style.justifyContent === 'center' &&
            style.borderTopColor !== '' &&
            root.getPropertyValue('--nc-theme-primary').trim() !== '' &&
            nav.querySelector('.nc-page-btn.is-active')?.getAttribute('aria-current') === 'page';
        }));

      await page.locator('#ncPodcastPagination .nc-page-btn:not(.nc-page-edge)[data-page="2"]').click();
      await page.waitForFunction(() => {
        const cards = [...document.querySelectorAll('#podcastGrid .podcast-card')];
        return cards.length === 6 && Number(cards[0]?.dataset.id) === 7;
      });
      check('page 2 replaces page 1 with only podcast records 7–12',
        JSON.stringify(await ids()) === JSON.stringify([7,8,9,10,11,12]), JSON.stringify(await ids()));
      check('page 2 active number is visibly and accessibly selected',
        await page.locator('#ncPodcastPagination [data-page="2"].is-active[aria-current="page"]').count() === 1);

      await page.locator('#ncPodcastPagination .nc-page-btn:not(.nc-page-edge)[data-page="3"]').click();
      await page.waitForFunction(() => {
        const cards = [...document.querySelectorAll('#podcastGrid .podcast-card')];
        return cards.length === 2 && Number(cards[0]?.dataset.id) === 13 && Number(cards[1]?.dataset.id) === 14;
      });
      check('last page shows only the remaining podcast records 13–14',
        JSON.stringify(await ids()) === JSON.stringify([13,14]), JSON.stringify(await ids()));
      check('last page disables the next-page control',
        await page.locator('#ncPodcastPagination .nc-page-edge:disabled').count() === 1);

      await page.locator('#searchInput').fill('پادکست آزمایشی 14');
      await page.waitForFunction(() => document.querySelectorAll('#podcastGrid .podcast-card').length === 1);
      check('search filters results and hides unnecessary pagination',
        await page.locator('#podcastGrid .podcast-card').count() === 1 &&
        await page.locator('#ncPodcastPagination').isHidden());

      await page.locator('#searchClear').click();
      await page.waitForFunction(() => {
        const cards = [...document.querySelectorAll('#podcastGrid .podcast-card')];
        return cards.length === 6 && Number(cards[0]?.dataset.id) === 1;
      });
      check('clearing search resets pagination to page 1',
        JSON.stringify(await ids()) === JSON.stringify([1,2,3,4,5,6]));

      const themeResults = await page.evaluate(themes => themes.map(theme => {
        document.documentElement.dataset.theme = theme;
        const nav = document.getElementById('ncPodcastPagination');
        const button = nav.querySelector('.nc-page-btn.is-active');
        const style = getComputedStyle(button);
        const root = getComputedStyle(document.documentElement);
        return {
          theme,
          primary: root.getPropertyValue('--nc-theme-primary').trim(),
          background: style.backgroundImage,
          borderRadius: style.borderRadius,
          readable: style.color !== 'rgba(0, 0, 0, 0)' && style.color !== ''
        };
      }), themeIds);
      check('pagination adapts to all eight active themes',
        themeResults.every(item => item.primary && item.background !== 'none' && item.borderRadius && item.readable),
        themeResults.map(item => item.theme + ':' + item.primary).join(', '));

      const geometry = await page.evaluate(() => {
        const nav = document.getElementById('ncPodcastPagination').getBoundingClientRect();
        const grid = document.getElementById('podcastGrid').getBoundingClientRect();
        return {
          navCenter: nav.left + nav.width / 2,
          viewportCenter: window.innerWidth / 2,
          belowGrid: nav.top >= grid.bottom - 1,
          overflow: document.documentElement.scrollWidth > window.innerWidth
        };
      });
      check('pagination is centered below cards with no horizontal overflow at ' + viewport.width + 'px',
        Math.abs(geometry.navCenter - geometry.viewportCenter) < 3 && geometry.belowGrid && !geometry.overflow,
        JSON.stringify(geometry));
      await context.close();
    }
  } catch (error) {
    failures.push(error.stack || error.message);
    console.error(error.stack || error);
  } finally {
    await browser.close();
  }
  console.log('SUMMARY | ' + (failures.length ? 'FAIL' : 'PASS') + ' | ' + (failures.length ? failures.join(' || ') : 'All podcast pagination checks passed'));
  if (failures.length) process.exit(1);
})();
