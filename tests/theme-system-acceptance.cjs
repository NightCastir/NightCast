const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const check = (label, condition) => {
    console.log(`${condition ? 'PASS' : 'FAIL'} | ${label}`);
    if (!condition) failures.push(label);
  };
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => { if (/nightcast-theme\.js|NightCast Theme System/i.test(error.stack || error.message)) failures.push('theme controller browser error: ' + error.message); });
    const response = await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    check('homepage loads successfully', !!response && response.ok());
    check('theme stylesheet is requested', (await page.request.get('http://127.0.0.1:4173/css/nightcast-themes.css?v=1')).ok());
    check('theme controller is requested', (await page.request.get('http://127.0.0.1:4173/js/nightcast-theme.js?v=1')).ok());

    await page.waitForFunction(() => !!window.NightCastThemes, null, { timeout: 10000 });
    check('theme controller exposes the eight themes', (await page.evaluate(() => window.NightCastThemes.list().length)) === 8);
    check('all eight theme cards are present', (await page.locator('[data-theme-choice]').count()) === 8);
    check('loader has a semantic progress bar and numeric value', await page.locator('#nc-entry-track[role="progressbar"][aria-valuemin="0"][aria-valuemax="100"]').count() === 1);
    check('loader uses a determinate fill element', await page.locator('#nc-entry-progress-fill').count() === 1);

    await page.evaluate(() => {
      document.getElementById('profileOverlay').classList.add('show');
      document.getElementById('profileGuest').hidden = true;
      document.getElementById('profileLogged').hidden = false;
    });
    await page.locator('#profileSettingsBtn').click();
    check('profile Settings opens theme selection in-place', await page.locator('#profileThemeSettings').isVisible());
    check('theme cards show a preview image', await page.locator('[data-theme-choice="aurora"] .nc-theme-image img').count() === 1);

    await page.locator('[data-theme-choice="aurora"]').click();
    check('selecting Aurora updates the document theme', await page.locator('html').getAttribute('data-theme') === 'aurora');
    check('selecting Aurora updates global CSS variables', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--nc-theme-primary').trim().toLowerCase()) === '#34d399');
    check('selected theme is announced accessibly', (await page.locator('#ncThemeSelectionStatus').innerText()).includes('شفق قطبی'));
    check('active theme is persisted locally', await page.evaluate(() => localStorage.getItem('nightcast-theme')) === 'aurora');

    await page.reload({ waitUntil: 'domcontentloaded' });
    check('saved theme survives a reload', await page.locator('html').getAttribute('data-theme') === 'aurora');
    await page.evaluate(() => {
      document.getElementById('profileOverlay').classList.add('show');
      document.getElementById('profileGuest').hidden = true;
      document.getElementById('profileLogged').hidden = false;
    });
    await page.locator('#profileSettingsBtn').click();
    check('persisted theme is marked selected', await page.locator('[data-theme-choice="aurora"]').getAttribute('aria-pressed') === 'true');

    await page.setViewportSize({ width: 360, height: 800 });
    const panel = await page.locator('.profile-panel').boundingBox();
    const grid = await page.locator('.nc-theme-grid').boundingBox();
    check('profile panel fits narrow mobile viewport', !!panel && panel.x >= 0 && panel.x + panel.width <= 360.5);
    check('theme grid fits inside the profile panel', !!panel && !!grid && grid.x >= panel.x - 1 && grid.x + grid.width <= panel.x + panel.width + 1);

    const loginResponse = await page.goto('http://127.0.0.1:4173/users/login.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    check('Google sign-in page loads successfully', !!loginResponse && loginResponse.ok());
    await page.waitForFunction(() => !!window.NightCastThemes, null, { timeout: 10000 });
    check('saved theme is also applied on sign-in page', await page.locator('html').getAttribute('data-theme') === 'aurora');
    check('sign-in page includes shared theme stylesheet', await page.locator('link[href*="nightcast-themes.css"]').count() === 1);

    await context.close();
  } catch (error) {
    failures.push(error.stack || error.message);
  } finally {
    await browser.close();
  }
  if (failures.length) {
    console.error('\nTheme acceptance failures:\n' + failures.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('\nSUMMARY | NightCast theme system acceptance checks passed');
  }
})();
