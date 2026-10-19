'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = fs.readFileSync('index.html', 'utf8');
const legacy = fs.readFileSync('podcasts/index.html', 'utf8');
const redirects = fs.readFileSync('_redirects', 'utf8');

function check(name, fn) {
  try { fn(); console.log('TRUE | ' + name); }
  catch (error) { console.error('FALSE | ' + name + ' | ' + (error.message || error)); process.exitCode = 1; }
}

check('Welcome hero is removed from the canonical entry', () => {
  assert.doesNotMatch(root, /id=["']heroTitle["']/i, 'The welcome heading must not be part of the root document');
  assert.doesNotMatch(root, /class=["']hero(?:\s|["'])/i, 'The welcome hero section must not exist on the canonical entry');
  assert.doesNotMatch(root, /اندیشه\s*های\s*بزرگ[\s\S]{0,180}روایت\s*های\s*ماندگار/i, 'The welcome slogan must not be rendered on the root entry');
  const mainStart = root.indexOf('<main');
  const podcastStart = root.indexOf('<section', mainStart);
  assert.ok(mainStart >= 0 && podcastStart >= 0, 'Main content and first section must exist');
  assert.match(root.slice(podcastStart, podcastStart + 220), /id=["']podcasts["']/i, 'The podcast archive must be the first main section');
});
check('Root document contains the real podcast archive', () => {
  assert.match(root, /id=["']podcastGrid["']/i);
  assert.match(root, /id=["']podcasts["']/i);
  assert.match(root, /function loadPodcasts\s*\(/);
});
check('Root is the canonical URL for the podcast archive', () => {
  assert.match(root, /<link rel=["']canonical["'] href=["']https:\/\/nightcast\.ir\//i);
  assert.doesNotMatch(root, /<link rel=["']canonical["'] href=["']https:\/\/nightcast\.ir\/podcasts/i);
});
check('No second-document timed splash redirect remains on root', () => {
  assert.doesNotMatch(root, /setTimeout\s*\(\s*function\s*\(\)\s*\{\s*window\.location\.replace\(target\)/i);
  assert.doesNotMatch(root, /window\.location\.replace\(["']\/podcasts["']\)/i);
});
check('Galaxy loader is part of the archive document and waits for essential readiness', () => {
  assert.match(root, /id=["']nc-entry-loader["']/);
  assert.match(root, /Promise\.allSettled\(\[loadPodcasts\(\),\s*loadFavorites\(\)\]\)/);
  assert.match(root, /Promise\.all\(\[archiveReady,\s*fontsReady\]\)/);
  assert.match(root, /dismissArchiveLoader/);
});
check('Former archive-relative assets resolve from root', () => {
  assert.doesNotMatch(root, /(?:href|src)=["']\.\.\//i);
  const localRefs = [...root.matchAll(/(?:href|src)=["'](\/(?:css|js|assets|users|favicon\.ico|logo\.png)[^"']*)["']/gi)].map(m => m[1].split(/[?#]/)[0]);
  const missing = [...new Set(localRefs)].filter(ref => !fs.existsSync(path.join(process.cwd(), ref.replace(/^\//, ''))));
  assert.deepEqual(missing, [], 'Missing root-relative assets: ' + missing.join(', '));
});
check('Root entry keeps the previous podcast-section landing behavior', () => {
  const routes = fs.readFileSync('js/clean-routes.js', 'utf8');
  assert.ok(routes.includes('"/": "podcasts"'), 'Root path must target the podcast section');
  assert.ok(routes.includes('"/index.html": "podcasts"'), 'Bundled index.html must target the podcast section');
  assert.ok(routes.includes('link.getAttribute("href") === "#podcasts"'), 'Podcast navigation active state must be preserved');
});
check('Legacy /podcasts page redirects immediately and preserves query/hash', () => {
  assert.match(legacy, /window\.location\.replace\(target\)/);
  assert.match(legacy, /window\.location\.search/);
  assert.match(legacy, /window\.location\.hash/);
  assert.ok(legacy.includes('index\\.html'), 'Direct /podcasts/index.html bookmarks must also redirect');
  assert.match(redirects, /^\/podcasts\s+\/\s+301$/m);
  assert.match(redirects, /^\/podcasts\/\s+\/\s+301$/m);
});
check('Legacy archive and section URLs are lightweight aliases to the canonical document', () => {
  const aliases = [
    { file: 'users/index.html', section: 'podcasts' },
    { file: 'about/index.html', section: 'about' },
    { file: 'contact/index.html', section: 'contact' }
  ];
  for (const alias of aliases) {
    const html = fs.readFileSync(alias.file, 'utf8');
    assert.ok(html.length < 2000, alias.file + ' must remain a lightweight compatibility document, not a duplicated site');
    assert.match(html, /<meta name="robots" content="noindex,follow">/i);
    assert.match(html, /<link rel="canonical" href="https:\/\/nightcast\.ir\/">/i);
    assert.match(html, /target\.search = current\.search/);
    assert.match(html, new RegExp('target\\\\.hash = current\\\\.hash \\\\|\\\\| "' + alias.section + '"'));
    assert.match(html, /window\.location\.replace\(target\.toString\(\)\)/);
    assert.ok(html.includes('href="/#' + alias.section + '"'), alias.file + ' must provide a no-JavaScript fallback');
  }
  assert.match(redirects, /^\/about\s+\/about\/index\.html\s+200$/m);
  assert.match(redirects, /^\/contact\s+\/contact\/index\.html\s+200$/m);
});

check('Canonical route handler honors direct section hashes and active navigation', () => {
  const routes = fs.readFileSync('js/clean-routes.js', 'utf8');
  assert.match(routes, /const hashTarget = validSections\.has\(requestedHash\) \? requestedHash : null/);
  assert.match(routes, /const targetId = hashTarget \|\| routes\[path\]/);
  assert.match(routes, /href === "#" \+ targetId/);
  assert.ok(routes.includes('" / "'), 'route handler source should remain available for review');
});

check('Sitemap lists only the canonical HTML document', () => {
  const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
  assert.match(sitemap, /<loc>https:\/\/nightcast\.ir\/<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/nightcast\.ir\/(?:about|contact|podcasts)<\/loc>/);
});

check('Canonical archive remains Persian RTL and responsive', () => {
  assert.match(root, /<html[^>]*lang=["']fa["'][^>]*dir=["']rtl["']/i);
  assert.match(root, /name=["']viewport["']/i);
  assert.match(root, /nightcast-responsive-fix\.css/i);
});

if (process.exitCode) process.exit(process.exitCode);
