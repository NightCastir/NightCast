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
    const themeStylesheetHref = await page.locator('link[rel="stylesheet"][href*="/css/nightcast-themes.css"]').first().getAttribute('href').catch(() => null);
    check('theme CSS is loaded from the canonical stylesheet', !!themeStylesheetHref && (await page.request.get(new URL(themeStylesheetHref, 'http://127.0.0.1:4173/').href)).ok());
    const scriptOrder = await page.locator('script[src]').evaluateAll(scripts => scripts.map(script => new URL(script.src, location.href).pathname));
    const themeControllerIndex = scriptOrder.indexOf('/js/nightcast-theme.js');
    const appControllerIndex = scriptOrder.findIndex(path => /^\/js\/nightcast-app(?:-v\d+)?\.js$/.test(path));
    check('theme controller is loaded before the app', themeControllerIndex >= 0 && appControllerIndex >= 0 && themeControllerIndex < appControllerIndex);
    check('theme controller is requested', themeControllerIndex >= 0 && (await page.request.get('http://127.0.0.1:4173/js/nightcast-theme.js').then(response => response.ok())));

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
    check('theme transition shows a blocking progress overlay', await page.locator('#nc-theme-transition.is-active').count() === 1);
    await page.waitForFunction(() => window.NightCastThemes && !window.NightCastThemes.isTransitioning(), null, { timeout: 30000 });
    check('theme transition finishes at 100 percent', await page.locator('#nc-theme-transition .nct-track[role="progressbar"]').getAttribute('aria-valuenow') === '100');
    check('selecting Aurora updates the document theme', await page.locator('html').getAttribute('data-theme') === 'aurora');
    check('selecting Aurora updates global CSS variables', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--nc-theme-primary').trim().toLowerCase()) === '#34d399');
    check('theme texture token is configured', await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--nc-theme-texture').includes('/assets/themes/')));
    check('selected theme is persisted locally', await page.evaluate(() => localStorage.getItem('nightcast-theme')) === 'aurora');
    check('theme button is available globally rather than in profile settings', await page.locator('#ncThemeLauncher').count() === 1);

    await page.reload({ waitUntil: 'domcontentloaded' });
    check('saved theme survives a reload', await page.locator('html').getAttribute('data-theme') === 'aurora');

    check('homepage exposes floating theme launcher', await page.locator('#ncThemeLauncher').count() === 1);
    await page.locator('#ncThemeLauncher').click();
    check('theme ribbon opens from the page edge', await page.locator('#ncThemeRibbon.is-open').count() === 1);
    check('ribbon contains eight distinct theme options', await page.locator('[data-ribbon-theme-choice]').count() === 8);
    await page.locator('[data-ribbon-theme-choice="aurora"]').click();
    await page.waitForFunction(() => window.NightCastThemes && !window.NightCastThemes.isTransitioning(), null, { timeout: 30000 });
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
      if (grid && !grid.querySelector('.podcast-card')) grid.innerHTML = '<article class="podcast-card"><div class="podcast-info"><div class="podcast-card-overline"><span class="podcast-category">دسته آزمایشی</span><span class="podcast-episode">قسمت ۱</span></div><h3 class="podcast-title">Theme acceptance card</h3><p class="podcast-desc">Surface and text sample</p><div class="meta"><span>آزمون</span></div><div class="card-footer"><button class="btn btn-secondary" type="button">Action</button></div></div></article>';
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
      check('theme tokens and distinct texture resolve for ' + themeId, appearance.id === themeId && !!appearance.primary && !!appearance.surface && appearance.texture.includes('/assets/themes/'));
      const themeImageUrl = await page.evaluate(id => window.NightCastThemes.list().find(theme => theme.id === id).image, themeId);
      const cdnImageLoaded = await page.evaluate(url => new Promise(resolve => {
        const image = new Image();
        let settled = false;
        const finish = ok => { if (settled) return; settled = true; clearTimeout(timer); resolve(ok); };
        const timer = setTimeout(() => finish(false), 10000);
        image.onload = () => finish(image.naturalWidth > 0);
        image.onerror = () => finish(false);
        image.src = url;
      }), themeImageUrl);
      check('Local theme artwork loads successfully for ' + themeId, cdnImageLoaded);
      await page.setViewportSize({ width: 360, height: 800 });
      check('no horizontal overflow on mobile for ' + themeId, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
      await page.setViewportSize({ width: 1440, height: 900 });
      check('no horizontal overflow on desktop for ' + themeId, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
      const card = page.locator('#podcastGrid .podcast-card').first();
      const cardAppearance = await card.evaluate(el => ({bg:getComputedStyle(el).backgroundImage,border:getComputedStyle(el).borderColor,color:getComputedStyle(el).color}));
      const textureVisibility = await page.evaluate(() => ({
        page: getComputedStyle(document.body).backgroundImage,
        card: getComputedStyle(document.querySelector('#podcastGrid .podcast-card')).backgroundImage
      }));
      check('local theme texture is actually applied to page for ' + themeId, textureVisibility.page.includes('/assets/themes/'));
      check('local theme texture is actually applied to podcast card for ' + themeId, textureVisibility.card.includes('/assets/themes/'));
      observedCardSurfaces.add(cardAppearance.bg + '|' + cardAppearance.border + '|' + cardAppearance.color);
      check('podcast card surface and border are theme-bound for ' + themeId, cardAppearance.bg.includes('linear-gradient') && !!cardAppearance.border && !!cardAppearance.color);
      const viewButtons = await page.locator('#podcasts .nc-view-button').evaluateAll(buttons => buttons.map(button => ({
        pressed: button.getAttribute('aria-pressed'),
        color: getComputedStyle(button).color,
        background: getComputedStyle(button).backgroundColor,
        border: getComputedStyle(button).borderTopColor
      })));
      check('view switch exposes clearly different active and inactive states for ' + themeId,
        viewButtons.length === 2 &&
        viewButtons.some(button => button.pressed === 'true') &&
        viewButtons.some(button => button.pressed === 'false') &&
        viewButtons[0].background !== viewButtons[1].background &&
        viewButtons[0].border !== viewButtons[1].border);
      if (themeId === 'moonlight') {
        check('Moonlight active view control is indigo with white text',
          viewButtons.some(button => button.pressed === 'true' &&
            button.background === 'rgb(81, 69, 205)' && button.color === 'rgb(255, 255, 255)'));
        check('Moonlight inactive view control has charcoal text and a visible gray border',
          viewButtons.some(button => button.pressed === 'false' &&
            button.color === 'rgb(48, 55, 71)' && button.border === 'rgb(174, 182, 198)'));
        check('Moonlight view settings panel is warm ivory',
          await page.locator('#podcasts .nc-view-settings').evaluate(el =>
            getComputedStyle(el).backgroundImage.includes('245, 241, 231') ||
            getComputedStyle(el).backgroundColor === 'rgb(255, 254, 250)'));
        check('Moonlight category and episode chips use cream surfaces',
          await page.locator('#podcasts .podcast-card-overline .podcast-category, #podcasts .podcast-card-overline .podcast-episode').first().evaluate(el =>
            getComputedStyle(el).backgroundColor === 'rgb(248, 245, 237)' &&
            getComputedStyle(el).color === 'rgb(57, 53, 121)'));
      }
    }
    check('podcast card appearance changes across theme palettes', observedCardSurfaces.size >= 7);
    await page.evaluate(() => window.NightCastThemes.apply('moonlight', false));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      const modal = document.getElementById('ncPodcastDetail');
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.getElementById('ncPodcastDetailBody').innerHTML =
        '<div class="nc-detail-hero"><img class="nc-detail-cover" src="/logo.png" alt=""><div class="nc-detail-heading"><h2 id="ncPodcastDetailTitle">آزمون خوانایی</h2><p class="nc-detail-author">NightCast</p></div></div><section class="nc-detail-section"><h3>معرفی کوتاه</h3><p id="ncDetailReadableSample">متن آزمایشی برای بررسی کنتراست و فاصله‌گذاری پنل جزئیات پادکست.</p></section>';
    });
    check('Moonlight podcast details body uses readable charcoal text',
      await page.locator('#ncDetailReadableSample').evaluate(el => getComputedStyle(el).color === 'rgb(69, 77, 93)'));
    check('Moonlight podcast details sections use soft neutral borders',
      await page.locator('#ncPodcastDetail .nc-detail-section').first().evaluate(el => {
        const color = getComputedStyle(el).borderTopColor;
        return color === 'rgba(91, 101, 120, 0.24)' || color === 'rgba(91, 101, 120, 0.22)';
      }));
    check('podcast details section has intentional padding and spacing',
      await page.locator('#ncPodcastDetail .nc-detail-section').first().evaluate(el =>
        parseFloat(getComputedStyle(el).paddingTop) >= 14 &&
        parseFloat(getComputedStyle(el).marginBottom) >= 10 &&
        parseFloat(getComputedStyle(el.querySelector('p')).lineHeight) >= 30));
    await page.evaluate(() => {
      const player = document.getElementById('playerBar');
      const audio = document.getElementById('audioPlayer');
      window.__ncSwipePaused = false;
      audio.pause = () => { window.__ncSwipePaused = true; };
      player.classList.add('show');
      player.setAttribute('aria-hidden', 'false');
      document.body.classList.add('player-open');
      const target = player.querySelector('.player-inner');
      const make = (type, x) => new PointerEvent(type, {
        bubbles: true, pointerId: 7, pointerType: 'touch', isPrimary: true,
        clientX: x, clientY: 300
      });
      target.dispatchEvent(make('pointerdown', 20));
      target.dispatchEvent(make('pointermove', 155));
      target.dispatchEvent(make('pointerup', 155));
    });
    check('mobile right-swipe pauses and dismisses the mini player',
      await page.evaluate(() => window.__ncSwipePaused &&
        !document.getElementById('playerBar').classList.contains('show') &&
        document.getElementById('playerBar').getAttribute('aria-hidden') === 'true' &&
        !document.body.classList.contains('player-open')));
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
