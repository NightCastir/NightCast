const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const check = (name, condition, detail = '') => {
    console.log(`${condition ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`);
    if (!condition) failures.push(name);
  };
  try {
    for (const viewport of [{ width: 1440, height: 900, label: 'desktop' }, { width: 768, height: 1024, label: 'tablet' }, { width: 390, height: 844, label: 'mobile' }]) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', error => failures.push(`${viewport.label} page error: ${error.message}`));
      const response = await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      check(`${viewport.label}: homepage loads`, !!response && response.ok());
      await page.waitForSelector('#ncThemeLauncher', { timeout: 15000 });
      await page.waitForSelector('#ncThemeRibbon', { timeout: 15000 });
      const panel = page.locator('#ncThemeRibbon');
      check(`${viewport.label}: document uses RTL layout`, await page.locator('html').getAttribute('dir') === 'rtl');
      check(`${viewport.label}: ribbon starts closed and inaccessible`, await panel.getAttribute('aria-hidden') === 'true' && await panel.evaluate(el => el.inert));
      check(`${viewport.label}: closed ribbon is visually hidden`, await panel.evaluate(el => getComputedStyle(el).visibility === 'hidden' && getComputedStyle(el).pointerEvents === 'none'));
      check(`${viewport.label}: closed ribbon thumbnails cannot be interacted with`, await panel.locator('.nc-theme-ribbon-option').evaluate(el => getComputedStyle(el).pointerEvents === 'none'));
      
      await page.locator('#ncThemeLauncher').click();
      check(`${viewport.label}: ribbon opens`, await panel.evaluate(el => el.classList.contains('is-open') && getComputedStyle(el).visibility === 'visible' && getComputedStyle(el).pointerEvents !== 'none'));
      const openRect = await panel.boundingBox();
      check(`${viewport.label}: opened ribbon is inside viewport`, !!openRect && openRect.x >= -1 && openRect.x < viewport.width && openRect.x + openRect.width <= viewport.width + 1, JSON.stringify(openRect));
      
      await page.locator('#ncThemeRibbonClose').click();
      check(`${viewport.label}: close button fully hides ribbon`, await panel.evaluate(el => !el.classList.contains('is-open') && el.getAttribute('aria-hidden') === 'true' && el.inert && getComputedStyle(el).visibility === 'hidden' && getComputedStyle(el).pointerEvents === 'none'));
      check(`${viewport.label}: closed ribbon is outside viewport`, await panel.evaluate(el => { const r = el.getBoundingClientRect(); return r.right <= 0 || r.left >= innerWidth; }));
      
      await page.locator('#ncThemeLauncher').click();
      await page.locator('#ncThemeRibbonScrim').click({ position: { x: 4, y: 4 } });
      check(`${viewport.label}: outside click closes ribbon`, await panel.evaluate(el => !el.classList.contains('is-open') && el.getAttribute('aria-hidden') === 'true' && getComputedStyle(el).visibility === 'hidden'));
      
      await page.locator('#ncThemeLauncher').click();
      await page.keyboard.press('Escape');
      check(`${viewport.label}: Escape closes ribbon`, await panel.evaluate(el => !el.classList.contains('is-open') && el.getAttribute('aria-hidden') === 'true' && el.inert && getComputedStyle(el).visibility === 'hidden'));
      await context.close();
    }
  } catch (error) {
    failures.push('uncaught browser test error: ' + error.message);
    console.error(error);
  } finally {
    await browser.close();
  }
  console.log(`SUMMARY | ${failures.length === 0 ? 'PASS' : 'FAIL'} | ${failures.length === 0 ? 'all theme ribbon dismissal checks passed' : failures.join('; ')}`);
  if (failures.length) process.exit(1);
})();
