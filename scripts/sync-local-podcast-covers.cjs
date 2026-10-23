#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const catalogPath = path.join(process.cwd(), 'users/data/podcasts.json');
const coversDir = path.join(process.cwd(), 'assets/podcasts/covers');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const podcasts = Array.isArray(catalog.podcasts) ? catalog.podcasts : [];
if (!podcasts.length) throw new Error('Podcast fallback catalog is empty; refusing to rewrite it.');

function localPathFor(url) {
  const parsed = new URL(url);
  const filename = path.posix.basename(decodeURIComponent(parsed.pathname));
  if (!/^[a-zA-Z0-9._-]+$/.test(filename) || filename === '.' || filename === '..') {
    throw new Error('Unsafe podcast cover filename: ' + filename);
  }
  return '/assets/podcasts/covers/' + filename;
}

async function main() {
  fs.mkdirSync(coversDir, { recursive: true });
  const sourceUrls = new Map();
  for (const podcast of podcasts) {
    if (typeof podcast.cover_url !== 'string' || !podcast.cover_url.trim()) continue;
    if (podcast.cover_url.startsWith('/assets/podcasts/covers/')) continue;
    const local = localPathFor(podcast.cover_url);
    const filename = path.basename(local);
    if (!sourceUrls.has(filename)) sourceUrls.set(filename, podcast.cover_url);
    podcast.cover_url = local;
  }

  const failures = [];
  let downloaded = 0;
  for (const [filename, url] of sourceUrls) {
    const destination = path.join(coversDir, filename);
    if (fs.existsSync(destination) && fs.statSync(destination).size > 100) continue;
    let response;
    try {
      response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 100 || !isImage(bytes)) throw new Error('Response is not a supported image');
      fs.writeFileSync(destination, bytes);
      downloaded++;
      console.log('Downloaded ' + filename + ' (' + bytes.length + ' bytes)');
    } catch (error) {
      failures.push(filename + ': ' + String(error.message || error));
    }
  }
  if (failures.length) {
    console.error('Cover synchronization failed:\n' + failures.join('\n'));
    process.exitCode = 1;
    return;
  }
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  const rssPath = path.join(process.cwd(), 'users/data/podcasts.xml');
  let rss = fs.readFileSync(rssPath, 'utf8');
  rss = rss.replace(/https:\/\/raw\\.githubusercontent\\.com\/NightCastir\/NightCast-Media\/(?:refs\/heads\/)?main\/covers\/([A-Za-z0-9._-]+)/g,
    '/assets/podcasts/covers/$1');
  if (/https:\/\/raw\\.githubusercontent\\.com\/NightCastir\/NightCast-Media\/(?:refs\/heads\/)?main\/covers\//i.test(rss)) {
    throw new Error('An external podcast cover URL remains in the RSS feed');
  }
  fs.writeFileSync(rssPath, rss);
  const missing = [...new Set(podcasts.map(p => p.cover_url).filter(Boolean))]
    .filter(url => !url.startsWith('/assets/podcasts/covers/') ||
      !fs.existsSync(path.join(process.cwd(), url.slice(1))));
  if (missing.length) throw new Error('Some catalog cover URLs are not local: ' + missing.join(', '));
  console.log('PASS | localized ' + sourceUrls.size + ' unique podcast covers; downloaded ' + downloaded + '; catalog records ' + podcasts.length);
}

function isImage(bytes) {
  return (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) ||
    (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') ||
    bytes.toString('ascii', 0, 3) === 'GIF';
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
