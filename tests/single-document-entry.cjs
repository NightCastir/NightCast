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
  assert.match(routes, /["']\\/["']\\s*:\\s*["']podcasts["']/);
  assert.match(routes, /path === ["']\\/["'][^;]*#podcasts/);
});
check('Legacy /podcasts page redirects immediately and preserves query/hash', () => {
  assert.match(legacy, /window\.location\.replace\(target\)/);
  assert.match(legacy, /window\.location\.search/);
  assert.match(legacy, /window\.location\.hash/);
  assert.match(redirects, /^\/podcasts\s+\/\s+301$/m);
  assert.match(redirects, /^\/podcasts\/\s+\/\s+301$/m);
});
check('Canonical archive remains Persian RTL and responsive', () => {
  assert.match(root, /<html[^>]*lang=["']fa["'][^>]*dir=["']rtl["']/i);
  assert.match(root, /name=["']viewport["']/i);
  assert.match(root, /nightcast-responsive-fix\.css/i);
});

if (process.exitCode) process.exit(process.exitCode);
