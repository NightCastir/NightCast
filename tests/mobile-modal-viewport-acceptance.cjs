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
  login: { url: '/users/login.html', actions: [{ selector: '#googleLoginButton', label: 'Google-only login control' }], scroll: 'document.scrollingElement' },
  comment: { url: '/', actions: [{ selector: '#ncCommentsSubmit', label: 'single comment submit' }], scroll: '#ncCommentsModal' },
  suggestion: { url: '/', actions: [{ selector: '#bookSummaryRequestSubmit', label: 'single suggestion submit' }], scroll: '#bookSummaryRequestModal .book-summary-request-panel' }
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
        const headers = {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'Content-Type, Accept'
        };
        if (route.request().method() === 'OPTIONS') {
          await route.fulfill({ status: 204, headers });
          return;
        }
        let actionName = target;
        try { actionName = route.request().postDataJSON().action || target; } catch (_) {}
        await route.fulfill({
          status: 200,
          headers,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, id: '1234567890abcdef1234567890abcdef', question: '3 + 4 = ?', action: actionName })
        });
      });
      await page.route('https://accounts.google.com/**', route => route.abort().catch(() => {}));
      await page.addInitScript(() => {
        if (location.origin === 'http://127.0.0.1:4173' && (location.pathname === '/' || location.pathname === '/index.html' || location.pathname === '/podcasts/')) {
          localStorage.setItem('NightCastToken', 'nightcast-mobile-layout-test');
          localStorage.setItem('NightCastUser', JSON.stringify({ id: 991, name: 'Responsive test' }));
        }
      });

      try {
        await page.goto(baseURL + selectors[target].url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (target === 'suggestion') {
          if (viewport.width <= 600) {
            await page.locator('#ncMenuToggle').waitFor({ state: 'visible', timeout: 12000 });
            await page.locator('#ncMenuToggle').click();
            const mobileSuggestion = page.locator('[data-request-book-summary]');
            await mobileSuggestion.waitFor({ state: 'visible', timeout: 8000 });
            await mobileSuggestion.click();
          } else {
            await page.locator('#requestBookSummaryBtn').waitFor({ state: 'visible', timeout: 12000 });
            await page.locator('#requestBookSummaryBtn').click();
          }
          await page.locator('#bookSummaryRequestModal:not([hidden])').waitFor({ state: 'visible', timeout: 8000 });
        } else if (target === 'comment') {
          await page.evaluate(() => {
            const modal = document.getElementById('ncCommentsModal');
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('nc-comments-open');
          });
        }

        if (target === 'comment' || target === 'suggestion') {
          const extraCaptchaButtons = await page.locator(target === 'comment'
            ? '#ncCommentsModal [data-nc-shield-continue]'
            : '#bookSummaryRequestModal [data-nc-shield-continue]').count();
          check(target + ' has exactly one submission action after CAPTCHA', extraCaptchaButtons === 0,
            'extra CAPTCHA submit buttons=' + extraCaptchaButtons);
        }

        for (const actionSpec of selectors[target].actions) {
          const action = page.locator(actionSpec.selector);
          await action.waitFor({ state: 'visible', timeout: 12000 });
          if (target === 'login') {
            await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight));
          } else {
            const scrollTarget = page.locator(selectors[target].scroll);
            await scrollTarget.evaluate(el => { el.scrollTop = el.scrollHeight; });
          }
          await action.scrollIntoViewIfNeeded();
          await page.waitForTimeout(60);
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
          check(target + ' ' + actionSpec.label + ' reachable at ' + viewport.width + 'x' + viewport.height + ' (' + viewport.label + ')',
            geometry.visible && geometry.withinHorizontalViewport && !geometry.disabled && geometry.display !== 'none' && geometry.visibility !== 'hidden',
            JSON.stringify(geometry));
        }

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

        if (target === 'comment' || target === 'suggestion') {
          await page.evaluate(() => {
            if (window.NightCastSuccessDialog) {
              window.NightCastSuccessDialog.show({
                title: 'ثبت شد',
                message: 'درخواست شما با موفقیت ثبت شد.'
              });
            }
          });
          const successDialog = page.locator('#ncSuccessDialog');
          await successDialog.waitFor({ state: 'visible', timeout: 3000 });
          await successDialog.locator('.nc-success-dialog__close').waitFor({ state: 'visible', timeout: 3000 });
          const successGeometry = await successDialog.locator('.nc-success-dialog__panel').evaluate(el => {
            const r = el.getBoundingClientRect();
            return { width: Math.round(r.width), left: Math.round(r.left), right: Math.round(r.right),
              viewportWidth: innerWidth, visible: r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth };
          });
          check(target + ' success confirmation dialog fits ' + viewport.width + 'x' + viewport.height,
            successGeometry.visible && successGeometry.left >= -1 && successGeometry.right <= viewport.width + 1,
            JSON.stringify(successGeometry));
          await successDialog.locator('.nc-success-dialog__close').click({ timeout: 5000 });
          await successDialog.waitFor({ state: 'hidden', timeout: 3000 });
        }
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
