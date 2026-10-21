const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const target = process.env.NIGHTCAST_MODAL_TARGET || 'login';
const baseURL = 'http://127.0.0.1:4173';
const viewports = [
  { width: 320, height: 568, label: 'small Android portrait' },
  { width: 360, height: 640, label: 'compact portrait' },
  { width: 390, height: 844, label: 'modern portrait' },
  { width: 844, height: 390, label: 'short landscape' }
];
const selectors = {
  login: { url: '/users/login.html', action: '[data-nc-shield-continue]', scroll: 'document.scrollingElement' },
  comment: { url: '/', action: '#ncCommentsSubmit', scroll: '#ncCommentsModal' },
  suggestion: { url: '/', action: '#bookSummaryRequestSubmit', scroll: '#bookSummaryRequestModal .book-summary-request-panel' }
};
assert.ok(selectors[target], 'Unknown NIGHTCAST_MODAL_TARGET: ' + target);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const check = (name, ok, detail = '') => {
    console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''));
    if (!ok) failures.push(name);
  };
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
      await page.route('https://nightcast-shield.tomasgermany2580.workers.dev/api/v1/captcha/challenge', async route => {
        let actionName = target;
        try { actionName = route.request().postDataJSON().action || target; } catch (_) {}
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, id: '1234567890abcdef1234567890abcdef', question: '3 + 4 = ?', action: actionName })
        });
      });
      await page.route('https://accounts.google.com/**', route => route.abort().catch(() => {}));
      await page.addInitScript(() => {
        localStorage.setItem('NightCastToken', 'nightcast-mobile-layout-test');
        localStorage.setItem('NightCastUser', JSON.stringify({ id: 991, name: 'Responsive test' }));
      });

      try {
        await page.goto(baseURL + selectors[target].url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (target === 'suggestion') {
          await page.locator('#requestBookSummaryBtn').waitFor({ state: 'visible', timeout: 12000 });
          await page.locator('#requestBookSummaryBtn').click();
          await page.locator('#bookSummaryRequestModal:not([hidden])').waitFor({ state: 'visible', timeout: 8000 });
        } else if (target === 'comment') {
          await page.evaluate(() => {
            const modal = document.getElementById('ncCommentsModal');
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('nc-comments-open');
          });
        }

        const action = page.locator(selectors[target].action);
        await action.waitFor({ state: 'visible', timeout: 12000 });
        if (target === 'login') {
          await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight));
        } else {
          const scrollTarget = page.locator(selectors[target].scroll);
          await scrollTarget.evaluate(el => { el.scrollTop = el.scrollHeight; });
        }
        await action.scrollIntoViewIfNeeded();
        await page.waitForTimeout(80);
        const geometry = await action.evaluate(el => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return {
            top: Math.round(r.top), bottom: Math.round(r.bottom),
            left: Math.round(r.left), right: Math.round(r.right),
            width: Math.round(r.width), height: Math.round(r.height),
            viewportWidth: innerWidth, viewportHeight: innerHeight,
            visible: r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight,
            withinHorizontalViewport: r.left >= -1 && r.right <= innerWidth + 1,
            disabled: el.disabled,
            display: cs.display,
            visibility: cs.visibility
          };
        });
        check(target + ' primary action reachable at ' + viewport.width + 'x' + viewport.height + ' (' + viewport.label + ')',
          geometry.visible && geometry.withinHorizontalViewport && !geometry.disabled && geometry.display !== 'none' && geometry.visibility !== 'hidden',
          JSON.stringify(geometry));

        const layout = await page.evaluate((kind) => {
          const modal = kind === 'comment' ? document.querySelector('#ncCommentsModal')
            : kind === 'suggestion' ? document.querySelector('#bookSummaryRequestModal .book-summary-request-panel')
            : document.querySelector('.login-page');
          if (!modal) return { found: false };
          const r = modal.getBoundingClientRect();
          const cs = getComputedStyle(modal);
          return {
            found: true,
            scrollHeight: modal.scrollHeight,
            clientHeight: modal.clientHeight,
            overflowY: cs.overflowY,
            width: Math.round(r.width),
            right: Math.round(r.right),
            left: Math.round(r.left)
          };
        }, target);
        check(target + ' layout has a bounded horizontal footprint at ' + viewport.width + 'x' + viewport.height,
          layout.found && layout.width > 0 && layout.left >= -1 && layout.right <= viewport.width + 1,
          JSON.stringify(layout));
      } catch (error) {
        check(target + ' browser scenario at ' + viewport.width + 'x' + viewport.height, false, error.message);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  if (failures.length) {
    console.error('FAILED | ' + failures.length + ' mobile modal viewport check(s): ' + failures.join('; '));
    process.exitCode = 1;
  } else {
    console.log('SUMMARY | ' + target + ' modal is reachable and horizontally contained across all tested mobile viewports');
  }
})();
