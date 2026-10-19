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
    page.on('pageerror', error => { if (/nightcast-theme(?:-experience)?\.js|NightCast Theme System/i.test(error.stack || error.message)) failures.push('theme controller browser error: ' + error.message); });
    const response = await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    check('homepage loads successfully', !!response && response.ok());
    check('theme stylesheet is requested', (await page.request.get('http://127.0.0.1:4173/css/nightcast-themes.css?v=1')).ok());
    check('theme controller is requested', (await page.request.get('http://127.0.0.1:4173/js/nightcast-theme.js?v=1')).ok());

    await page.waitForFunction(() => !!window.NightCastThemes, null, { timeout: 10000 });
    check('theme controller exposes the eight themes', (await page.evaluate(() => window.NightCastThemes.list().length)) === 8);
    check('profile no longer contains duplicate theme cards', (await page.locator('#profileThemeSettings, [data-theme-choice]').count()) === 0);
    check('global theme launcher is present', (await page.locator('#ncThemeLauncher').count()) === 1);
    check('loader has a semantic progress bar and numeric value', await page.locator('#nc-entry-track[role="progressbar"][aria-valuemin="0"][aria-valuemax="100"]').count() === 1);
    check('loader uses a determinate fill element', await page.locator('#nc-entry-progress-fill').count() === 1);

    check('profile no longer duplicates the global theme picker', await page.locator('#profileThemeSettings, [data-theme-choice]').count() === 0);
    await page.locator('#ncThemeLauncher').click();
    check('global theme ribbon opens from the page edge', await page.locator('#ncThemeRibbon.is-open').count() === 1);
    check('ribbon contains eight distinct theme options', await page.locator('[data-ribbon-theme-choice]').count() === 8);
    await page.locator('[data-ribbon-theme-choice="aurora"]').click();
    check('selecting Aurora updates the document theme', await page.locator('html').getAttribute('data-theme') === 'aurora');
    check('selecting Aurora updates global CSS variables', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--nc-theme-primary').trim().toLowerCase()) === '#34d399');
    check('theme texture token is configured', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--nc-theme-texture').includes('unsplash.com')));
    check('selected theme is persisted locally', await page.evaluate(() => localStorage.getItem('nightcast-theme')) === 'aurora');
    check('theme button is available globally rather than in profile settings', await page.locator('#ncThemeLauncher').count() === 1);

    await page.reload({ waitUntil: 'domcontentloaded' });
    check('saved theme survives a reload', await page.locator('html').getAttribute('data-theme') === 'aurora');

    check('homepage exposes floating theme launcher', await page.locator('#ncThemeLauncher').count() === 1);
    await page.locator('#ncThemeLauncher').click();
    check('theme ribbon opens from the page edge', await page.locator('#ncThemeRibbon.is-open').count() === 1);
    check('ribbon contains eight distinct theme options', await page.locator('[data-ribbon-theme-choice]').count() === 8);
    await page.locator('[data-ribbon-theme-choice="aurora"]').click();
    check('ribbon selection applies the central theme', await page.locator('html').getAttribute('data-theme') === 'aurora');
    check('ribbon selection closes after choosing', await page.locator('#ncThemeRibbon.is-open').count() === 0);

    await page.evaluate(() => {
      localStorage.setItem('NightCastUser', JSON.stringify({
        name: 'NightCast Test User', username: 'tester@example.com', picture: 'https://example.com/google-photo.png',
        email_verified: true, given_name: 'NightCast', family_name: 'Tester', locale: 'fa', google_sub: 'google-subject-123456'
      }));
      document.getElementById('profileOverlay').classList.add('show');
      document.getElementById('profileGuest').hidden = true;
      document.getElementById('profileLogged').hidden = false;
    });
    await page.waitForSelector('#ncAvatarChoiceSection');
    check('profile shows the signed-in email below the avatar', await page.evaluate(() => {
      const avatar = document.querySelector('.profile-avatar-wrap').getBoundingClientRect();
      const email = document.getElementById('profileEmail').getBoundingClientRect();
      return email.top >= avatar.bottom - 1 && document.getElementById('profileEmail').textContent === 'tester@example.com';
    }));
    check('profile shows Google claims when available', await page.locator('#ncGoogleDetails').innerText().then(text => text.includes('ایمیل تأیید شده') && text.includes('نام خانوادگی') && text.includes('شناسه Google')));
    check('animal avatar gallery exposes 20 SVG choices', await page.locator('#ncAvatarGrid [data-avatar-code]').count() === 20);
    await page.locator('#ncAvatarGrid [data-avatar-code="1F431"]').click();
    check('chosen SVG avatar is saved locally', await page.evaluate(() => localStorage.getItem('nightcast-custom-avatar')?.endsWith('/1F431.svg')) === true);
    check('chosen avatar is synchronized in profile and header', await page.evaluate(() => {
      const profile = document.getElementById('profileAvatar').getAttribute('src');
      const header = document.getElementById('userAvatar').getAttribute('src');
      return !!profile && profile === header && profile.endsWith('/1F431.svg');
    }));
    await page.locator('#ncAvatarReset').click();
    check('user can restore the Google profile photo', await page.locator('#profileAvatar').getAttribute('src') === 'https://example.com/google-photo.png');
    await page.evaluate(() => {
      document.getElementById('profileOverlay').classList.add('show');
      document.getElementById('profileGuest').hidden = true;
      document.getElementById('profileLogged').hidden = false;
    });
    check('profile has no duplicate theme settings panel or settings button', await page.locator('#profileThemeSettings, #profileSettingsBtn').count() === 0);
    check('global theme ribbon reflects the persisted selection', await page.locator('[data-ribbon-theme-choice="aurora"]').getAttribute('aria-pressed') === 'true');

    await page.evaluate(() => {
      const grid = document.getElementById('podcastGrid');
      if (grid && !grid.querySelector('.podcast-card')) grid.innerHTML = '<article class="podcast-card"><h3>Theme acceptance card</h3><p>Surface and text sample</p><button type="button">Action</button></article>';
    });
    const themeIds = ['midnight-cosmos','aurora','studio-noir','deep-ocean','royal-gold','neon-city','persian-heritage','moonlight'];
    const observedCardSurfaces = new Set();
    for (const themeId of themeIds) {
      await page.evaluate(id => window.NightCastThemes.apply(id, false), themeId);
      const appearance = await page.evaluate(() => ({
        id: document.documentElement.dataset.theme,
        primary: getComputedStyle(document.documentElement).getPropertyValue('--nc-theme-primary').trim(),
        surface: getComputedStyle(document.documentElement).getPropertyValue('--nc-theme-surface').trim(),
        texture: getComputedStyle(document.documentElement).getPropertyValue('--nc-theme-texture').trim()
      }));
      check('theme tokens and distinct texture resolve for ' + themeId, appearance.id === themeId && !!appearance.primary && !!appearance.surface && appearance.texture.includes('unsplash.com'));
      const card = page.locator('#podcastGrid .podcast-card').first();
      const cardAppearance = await card.evaluate(el => ({bg:getComputedStyle(el).backgroundImage,border:getComputedStyle(el).borderColor,color:getComputedStyle(el).color}));
      observedCardSurfaces.add(cardAppearance.bg + '|' + cardAppearance.border + '|' + cardAppearance.color);
      check('podcast card surface and border are theme-bound for ' + themeId, cardAppearance.bg.includes('linear-gradient') && !!cardAppearance.border && !!cardAppearance.color);
    }
    check('podcast card appearance changes across theme palettes', observedCardSurfaces.size >= 7);
    }
    await page.evaluate(() => window.NightCastThemes.apply('aurora', false));

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
