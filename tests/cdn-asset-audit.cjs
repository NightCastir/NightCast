#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const output = path.join(root, 'artifacts');
const extensions = new Set(['.html','.htm','.css','.js','.mjs','.cjs','.json','.xml','.svg','.webmanifest','.yml','.yaml','.md','.txt']);
const skip = new Set(['.git','node_modules','.wrangler','dist','coverage','artifacts']);
const staticCdn = new Set(['fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com','cdn.jsdelivr.net','unpkg.com','images.unsplash.com']);
function walk(dir, result = []) {
  for (const item of fs.readdirSync(dir,{withFileTypes:true})) {
    if (item.isDirectory() && skip.has(item.name)) continue;
    const file = path.join(dir,item.name);
    if (item.isDirectory()) walk(file,result);
    else if (extensions.has(path.extname(item.name).toLowerCase())) result.push(file);
  }
  return result;
}
function classify(url, context) {
  let host = '';
  try { host = new URL(url).hostname.toLowerCase(); } catch {}
  if (staticCdn.has(host)) return 'static-cdn-asset';
  if (host === 'raw.githubusercontent.com' && /NightCast-Media\/main\/covers\//i.test(url)) return 'external-podcast-cover';
  if (host === 'raw.githubusercontent.com' && /NightCast-Media\/main\/audio\//i.test(url)) return 'external-podcast-audio';
  if (host.endsWith('.workers.dev')) return 'backend-api-service';
  if (host.endsWith('openstreetmap.org') || host.endsWith('.tile.openstreetmap.org')) return 'map-provider-service';
  if (/google\.com\/maps|maps\.googleapis\.com/i.test(url)) return 'external-navigation-service';
  if (/(?:src\s*=|href\s*=|url\s*\(|font|image|loader|cover_url|audio_url|tileLayer|script\.src|avatar|icon|leaflet|webfont)/i.test(context) || /\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|eot|css|mjs|mp3|mp4)(?:[?#]|$)/i.test(url)) return 'external-asset-or-resource';
  return 'external-link-or-metadata';
}
const files = walk(root);
const refs = [];
for (const file of files) {
  const rel = path.relative(root,file).split(path.sep).join('/');
  const runtime = !/^(?:tests|docs|\.github)\//.test(rel) && !/^(?:README|CHANGELOG)/i.test(rel);
  let text;
  try { text = fs.readFileSync(file,'utf8'); } catch { continue; }
  const re = /https?:\/\/[^\s"'<>\x60]+/g;
  let match;
  while ((match = re.exec(text))) {
    const url = match[0].replace(/[),.;\]}]+$/g,'');
    let host = '';
    try { host = new URL(url).hostname.toLowerCase(); } catch {}
    refs.push({
      file: rel,
      line: text.slice(0,match.index).split('\n').length,
      url, host, runtime,
      category: classify(url,text.slice(Math.max(0,match.index-100),Math.min(text.length,match.index+url.length+100)).replace(/\s+/g,' '))
    });
  }
}
const seen = new Set();
const unique = refs.filter(r => { const k = [r.file,r.line,r.url].join('|'); if (seen.has(k)) return false; seen.add(k); return true; });
const runtimeRefs = unique.filter(r => r.runtime);
const groups = new Map();
for (const r of runtimeRefs) {
  const g = groups.get(r.host) || {host:r.host,count:0,categories:new Set(),files:new Set()};
  g.count++; g.categories.add(r.category); g.files.add(r.file); groups.set(r.host,g);
}
const hosts = [...groups.values()].map(g=>({host:g.host,references:g.count,categories:[...g.categories].sort(),files:[...g.files].sort()})).sort((a,b)=>b.references-a.references||a.host.localeCompare(b.host));
const report = {
  generatedAt:new Date().toISOString(), filesScanned:files.length,
  uniqueExternalReferences:unique.length, runtimeReferences:runtimeRefs.length,
  staticCdnReferences:runtimeRefs.filter(r=>r.category==='static-cdn-asset').length,
  externalPodcastCovers:runtimeRefs.filter(r=>r.category==='external-podcast-cover').length,
  externalPodcastAudio:runtimeRefs.filter(r=>r.category==='external-podcast-audio').length,
  hosts, references:unique
};
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'cdn-asset-inventory.json'),JSON.stringify(report,null,2)+'\n');
const lines = [
 '# NightCast external URL and CDN asset inventory','',
 'Generated: '+report.generatedAt,'',
 '- Files scanned: **'+report.filesScanned+'**',
 '- Unique external references in repository text files: **'+report.uniqueExternalReferences+'**',
 '- References in runtime files: **'+report.runtimeReferences+'**',
 '- Static CDN asset references in runtime files: **'+report.staticCdnReferences+'**',
 '- External podcast cover references: **'+report.externalPodcastCovers+'**',
 '- External podcast audio references: **'+report.externalPodcastAudio+'**','',
 '## Runtime host inventory','','| Host | References | Classification | Files |','|---|---:|---|---|',
 ...hosts.map(g=>'| `'+g.host+'` | '+g.references+' | '+g.categories.join(', ')+' | '+g.files.map(f=>'`'+f+'`').join(', ')+' |'),
 '','## Reference-level inventory','','| File:line | Category | URL |','|---|---|---|',
 ...unique.map(r=>'| `'+r.file+':'+r.line+'` | '+r.category+(r.runtime?'':' (non-runtime)')+' | `'+r.url.replace(/\|/g,'%7C')+'` |'),
 '','## Classification',
 '- **static-cdn-asset**: CDN-hosted fonts, CSS/JS packages, or theme imagery; migration targets.',
 '- **external-podcast-cover / external-podcast-audio**: media hosted in NightCast-Media; assess ownership, size and runtime API behavior before copying.',
 '- **backend-api-service / map-provider-service / external-navigation-service**: live services, not static files; do not blindly mirror them.',
 '- **external-link-or-metadata**: canonical URLs, social links, schema metadata and navigation.',
 '','This is an inventory report, not proof that assets have already been copied or localized.'
];
fs.writeFileSync(path.join(output,'cdn-asset-inventory.md'),lines.join('\n')+'\n');
console.log('CDN INVENTORY | files='+report.filesScanned+' runtime_refs='+report.runtimeReferences+' static_cdn='+report.staticCdnReferences+' podcast_covers='+report.externalPodcastCovers+' podcast_audio='+report.externalPodcastAudio);
console.log(lines.slice(0,Math.min(lines.length,45)).join('\n'));
if (process.argv.includes('--strict-assets') && report.staticCdnReferences) {
  console.error('FAIL | '+report.staticCdnReferences+' static CDN asset references remain in runtime files');
  process.exitCode = 1;
}
