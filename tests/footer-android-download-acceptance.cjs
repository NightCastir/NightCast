const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = process.cwd();
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const failures = [];
function check(label, condition, detail) {
  console.log((condition ? 'PASS' : 'FAIL') + ' | ' + label + (detail ? ' | ' + detail : ''));
  if (!condition) failures.push(label + (detail ? ': ' + detail : ''));
}
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

(async () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'css/nightcast-themes.css'), 'utf8');
  check('homepage has a labelled Android download feature in footer', /<section class="nc-footer-download"[^>]*aria-labelledby="ncFooterDownloadTitle"/.test(html));
  check('direct APK button points to official NightCast download endpoint', /href="https:\/\/www\.nightcast\.ir\/downloadrelease\/NightCast\.apk"[\s\S]{0,120}download="NightCast\.apk"/.test(html));
  check('Cafe Bazaar button uses official Cafe Bazaar domain and safe new-tab attributes', /href="https:\/\/cafebazaar\.ir\/app\/ir\.nightcast\.app"[\s\S]{0,120}target="_blank" rel="noopener noreferrer"/.test(html));
  check('Android and store icons are present', /fa-brands fa-android/.test(html) && /fa-solid fa-store/.test(html));
  check('theme stylesheet cache version is bumped', /nightcast-themes\.css\?v=9/.test(html));
  check('cosmic CTA has responsive, focus-visible and reduced-motion styles', css.includes('.nc-footer-download::before') && css.includes('.nc-footer-download-button:focus-visible') && css.includes('@media(max-width:760px)') && css.includes('prefers-reduced-motion:reduce'));
  check('Moonlight theme has a dedicated light readable CTA palette', /:root\[data-theme="moonlight"\] \.nc-footer-download/.test(css) && css.includes('--nc-download-ink:#242936'));

  await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const viewport of [
      { name: 'mobile', width: 390, height: 844 },
      { name: 'tablet', width: 820, height: 1180 },
      { name: 'desktop', width: 1440, height: 1000 }
    ]) {
      const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
      const response = await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      check(viewport.name + ': homepage loads', !!response && response.ok());
      const panel = page.locator('.nc-footer-download');
      await panel.scrollIntoViewIfNeeded({ timeout: 15000 });
      check(viewport.name + ': download panel is visible', await panel.isVisible());
      check(viewport.name + ': both download choices are visible', await page.locator('.nc-footer-download-button').count() === 2 && await page.locator('.nc-footer-download-button').nth(0).isVisible() && await page.locator('.nc-footer-download-button').nth(1).isVisible());
      const layout = await page.evaluate(() => {
        const panel = document.querySelector('.nc-footer-download');
        const buttons = Array.from(document.querySelectorAll('.nc-footer-download-button'));
        const rect = panel.getBoundingClientRect();
        const buttonRects = buttons.map(button => button.getBoundingClientRect());
        const style = getComputedStyle(panel);
        return {
          viewportWidth: innerWidth, docWidth: document.documentElement.scrollWidth,
          left: rect.left, right: rect.right, width: rect.width,
          backgroundImage: style.backgroundImage,
          buttons: buttonRects.map(r => ({ left: r.left, right: r.right, width: r.width, height: r.height, top: r.top }))
        };
      });
      check(viewport.name + ': download panel stays within viewport', layout.left >= -1 && layout.right <= viewport.width + 1 && layout.width > 0, JSON.stringify({ left: layout.left, right: layout.right, viewport: viewport.width }));
      check(viewport.name + ': no horizontal overflow caused by footer CTA', layout.docWidth <= viewport.width + 2, 'document=' + layout.docWidth + ', viewport=' + viewport.width);
      check(viewport.name + ': visual gradient effect is applied', layout.backgroundImage.includes('gradient'));
      check(viewport.name + ': both buttons have usable dimensions', layout.buttons.every(b => b.width >= (viewport.width <= 600 ? viewport.width * .65 : 110) && b.height >= 58), JSON.stringify(layout.buttons));
      if (viewport.width <= 600) check('mobile: download choices stack vertically', layout.buttons[1].top > layout.buttons[0].top && Math.abs(layout.buttons[1].left - layout.buttons[0].left) < 2);
      await page.locator('html').evaluate(el => el.dataset.theme = 'moonlight');
      const moonlight = await panel.evaluate(el => ({ background: getComputedStyle(el).backgroundImage, heading: getComputedStyle(el.querySelector('h2')).color }));
      check(viewport.name + ': Moonlight CTA remains readable', moonlight.heading !== 'rgba(0, 0, 0, 0)' && moonlight.background.includes('gradient'), JSON.stringify(moonlight));
      await page.close();
    }
  } catch (error) {
    failures.push(error.stack || error.message);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  if (failures.length) {
    console.error('\nFooter Android download acceptance failures:\n' + failures.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('\nSUMMARY | Footer Android download acceptance checks passed');
  }
})();