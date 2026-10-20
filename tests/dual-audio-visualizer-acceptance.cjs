'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/nightcast-app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/nightcast-player-finish.css'), 'utf8');

function check(name, fn) {
  try { fn(); console.log('PASS | ' + name); }
  catch (error) { console.error('FAIL | ' + name + ' | ' + error.message); throw error; }
}

check('two distinct visualizer canvases are wired into the player', () => {
  assert.match(html, /id="ncAudioVisualizerPrev"[^>]*class="nc-audio-visualizer"/);
  assert.match(html, /id="ncAudioVisualizer"[^>]*class="nc-audio-visualizer"/);
  assert.equal((html.match(/id="ncAudioVisualizer(?:Prev)?"/g) || []).length, 2);
});
check('previous-side copy is before Previous and main copy is after Next', () => {
  const controls = html.match(/<div class="controls" aria-label="کنترل‌های پخش">([\s\S]*?)<\/div>\s*<div class="player-progress">/);
  assert.ok(controls, 'player controls region must exist');
  const markup = controls[1];
  assert.ok(markup.indexOf('ncAudioVisualizerPrev') < markup.indexOf('id="prevBtn"'));
  assert.ok(markup.indexOf('id="nextBtn"') < markup.indexOf('id="ncAudioVisualizer"'));
});
check('both canvases use one real analyser/render loop', () => {
  assert.match(app, /createAnalyser\s*\(/);
  assert.match(app, /getByteFrequencyData\s*\(/);
  assert.match(app, /getByteTimeDomainData\s*\(/);
  assert.match(app, /ncAudioVisualizerPrev[\s\S]*?ncAudioVisualizer/);
  assert.match(app, /renderTargets\.forEach\(\(\{ canvas, context \}\)/);
  assert.match(app, /levels\.push\(level\)/);
});
check('left copy is flipped horizontally and both copies are responsive', () => {
  assert.match(css, /nc-audio-visualizer-wrap--previous[^}]*\.nc-audio-visualizer\s*\{\s*transform:\s*scaleX\(-1\)/);
  assert.match(css, /@media\(max-width:900px\)[\s\S]*?\.player \.controls/);
  assert.match(css, /@media\(max-width:380px\)[\s\S]*?nc-audio-visualizer-wrap/);
});

const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  const requested = pathname === '/' ? '/index.html' : pathname;
  const file = path.resolve(root, '.' + requested);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => console.error('BROWSER PAGE ERROR | ' + error.message));
    await page.goto('http://127.0.0.1:' + address.port + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.locator('#playerBar').evaluate(el => el.classList.add('show'));
    for (const viewport of [{width:360,height:800,name:'small mobile'},{width:390,height:844,name:'mobile'},{width:768,height:1024,name:'tablet'},{width:1280,height:900,name:'desktop'}]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(100);
      const result = await page.evaluate(() => {
        const ids = ['ncAudioVisualizerPrev','prevBtn','playButton','nextBtn','ncAudioVisualizer'];
        const elements = Object.fromEntries(ids.map(id => {
          const node = document.getElementById(id);
          const rect = node?.getBoundingClientRect();
          return [id, rect ? {left:rect.left,right:rect.right,width:rect.width,height:rect.height} : null];
        }));
        const player = document.getElementById('playerBar');
        return { elements, viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, playerWidth: player.getBoundingClientRect().width };
      });
      console.log('LAYOUT | ' + viewport.name + ' | ' + JSON.stringify(result.elements));
      assert.ok(result.elements.ncAudioVisualizerPrev && result.elements.ncAudioVisualizer, viewport.name + ': both canvases must exist');
      assert.ok(result.elements.ncAudioVisualizerPrev.width > 0 && result.elements.ncAudioVisualizer.width > 0, viewport.name + ': both canvases must be visible');
      assert.ok(result.elements.ncAudioVisualizerPrev.right <= result.elements.prevBtn.left + 1, viewport.name + ': flipped copy must be beside/before Previous');
      assert.ok(result.elements.ncAudioVisualizer.left >= result.elements.nextBtn.right - 1, viewport.name + ': main copy must be beside/after Next');
      assert.ok(result.documentWidth <= result.viewportWidth + 1, viewport.name + ': no horizontal page overflow');
      console.log('PASS | browser layout ' + viewport.name + ' (' + viewport.width + 'px): mirrored copy < Previous; Next < main copy; no horizontal overflow');
    }
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
  server.close();
});
