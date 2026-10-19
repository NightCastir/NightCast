const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 }, reducedMotion: 'reduce' });
  const failures = [];
  const check = (name, ok) => {
    console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
    if (!ok) failures.push(name);
  };
  try {
    await page.addInitScript(() => {
      localStorage.setItem('NightCastToken', 'ci-test-token');
      localStorage.setItem('NightCastUser', JSON.stringify({ id: 1, name: 'CI Test' }));
    });
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 15000 });

    check('desktop navigation has one suggestion button', await page.locator('#requestBookSummaryBtn').count() === 1);
    check('profile suggestion button is no longer inside profile', await page.locator('#profileLogged #requestBookSummaryBtn, #profileLogged .profile-book-request').count() === 0);
    check('profile has Settings shortcut', await page.locator('#profileSettingsBtn').count() === 1);
    check('profile retains Favorites', await page.locator('#profileFavorites').count() === 1);
    check('profile retains Logout', await page.locator('#profileLogout').count() === 1);
    check('request modal and form are retained', await page.locator('#bookSummaryRequestModal #bookSummaryRequestForm').count() === 1);

    await page.locator('#requestBookSummaryBtn').click();
    await page.locator('#bookSummaryRequestModal').waitFor({ state: 'visible', timeout: 5000 });
    check('desktop button opens the existing suggestion modal', await page.locator('#bookSummaryRequestModal').isVisible());
    await page.locator('#bookSummaryRequestClose').click();

    await page.setViewportSize({ width: 390, height: 844 });
    check('mobile drawer contains the suggestion action', await page.locator('[data-request-book-summary]').count() === 1);
    await page.locator('#ncMenuToggle').click();
    await page.locator('[data-request-book-summary]').click();
    await page.locator('#bookSummaryRequestModal').waitFor({ state: 'visible', timeout: 5000 });
    check('mobile menu button opens the same suggestion modal', await page.locator('#bookSummaryRequestModal').isVisible());
  } catch (error) {
    console.error('Browser acceptance error:', error.stack || error);
    failures.push('browser acceptance threw');
  } finally {
    await browser.close();
  }
  if (failures.length) {
    console.error('Failed checks:', failures.join(', '));
    process.exitCode = 1;
  } else {
    console.log('SUMMARY | All podcast suggestion navigation/profile browser checks passed');
  }
})();
