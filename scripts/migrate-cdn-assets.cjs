#!/usr/bin/env node
'use strict';

/*
 * One-time, auditable migration of static CDN assets into this repository.
 * Run only in the dedicated GitHub Actions workflow; it downloads assets,
 * rewrites references, updates regression assertions, and leaves a normal git diff.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const themes = {
  'midnight-cosmos': 'photo-1462331940025-496dfbfc7564',
  'moonlight': 'photo-1470252649378-9c29740c9fa8',
  'aurora': 'photo-1531366936337-7c912a4589a7',
  'studio-noir': 'photo-1598488035139-bdbb2231ce04',
  'deep-ocean': 'photo-1518837695005-2083093ee35b',
  'royal-gold': 'photo-1519681393784-d120267933ba',
  'neon-city': 'photo-1519608487953-e999c86e7455',
  'persian-heritage': 'photo-1561214115-f2f134cc4912'
};
const animals = ['1F431','1F436','1F43C','1F981','1F98A','1F43A','1F42F','1F430','1F43B','1F418','1F433','1F42C','1F989','1F985','1F98B','1F984','1F42E','1F437','1F438','1F427'];
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36';

function read(file) { return fs.readFileSync(path.join(ROOT,file),'utf8'); }
function write(file,text) {
  const full=path.join(ROOT,file);
  fs.mkdirSync(path.dirname(full),{recursive:true});
  fs.writeFileSync(full,text);
}
function assertReplace(text,pattern,replacement,label) {
  const next=text.replace(pattern,replacement);
  if(next===text) throw new Error('Expected source pattern was not changed: '+label);
  return next;
}
async function fetchBuffer(url,headers={}) {
  const response=await fetch(url,{headers:{'user-agent':userAgent,...headers},redirect:'follow'});
  if(!response.ok) throw new Error('Download failed ('+response.status+') '+url);
  const buffer=Buffer.from(await response.arrayBuffer());
  if(buffer.length<80) throw new Error('Downloaded asset is unexpectedly small ('+buffer.length+' bytes): '+url);
  return buffer;
}
async function fetchText(url,headers={}) { return (await fetchBuffer(url,headers)).toString('utf8'); }
async function saveUrl(url,file,headers={}) {
  const buffer=await fetchBuffer(url,headers);
  const full=path.join(ROOT,file);
  fs.mkdirSync(path.dirname(full),{recursive:true});
  fs.writeFileSync(full,buffer);
  console.log('ASSET | '+file+' | '+buffer.length+' bytes');
}
async function saveLicense(url,file) {
  try { const text=await fetchText(url); write(file,text); }
  catch(error) { throw new Error('Required upstream license could not be copied: '+url+' | '+error.message); }
}
function localCoverPath(url) {
  const parsed=new URL(url);
  const filename=decodeURIComponent(path.posix.basename(parsed.pathname));
  if(!/^[A-Za-z0-9._-]+$/.test(filename)) throw new Error('Unexpected cover filename: '+filename);
  return '/assets/podcasts/covers/'+filename;
}

async function main() {
  // Theme imagery: one local optimized-size image per theme serves previews and transitions.
  for(const [id,photo] of Object.entries(themes)) {
    await saveUrl('https://images.unsplash.com/'+photo+'?auto=format&fit=crop&w=1400&q=72','assets/themes/'+id+'.jpg');
  }
  write('assets/themes/ATTRIBUTION.md',
    '# Theme artwork sources\n\n'+Object.entries(themes).map(([id,photo])=>'- '+id+': https://images.unsplash.com/'+photo+' (downloaded for NightCast; Unsplash License)').join('\n')+'\n');

  // Vazirmatn: download the font-face CSS and every WOFF2 subset it references.
  const googleCssUrl='https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&display=swap';
  let fontCss=await fetchText(googleCssUrl,{'user-agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'});
  const fontUrls=[...new Set([...fontCss.matchAll(/url\((?:["']?)(https:\/\/fonts\.gstatic\.com\/[^)"']+)(?:["']?)\)/g)].map(m=>m[1]))];
  if(!fontUrls.length) throw new Error('Google Fonts stylesheet did not expose any downloadable font files');
  const fontMap=new Map();
  for(let i=0;i<fontUrls.length;i++) {
    const ext=path.extname(new URL(fontUrls[i]).pathname)||'.woff2';
    const name='vazirmatn-'+String(i+1).padStart(2,'0')+ext;
    await saveUrl(fontUrls[i],'assets/fonts/vazirmatn/'+name);
    fontMap.set(fontUrls[i],'/assets/fonts/vazirmatn/'+name);
  }
  fontCss=fontCss.replace(/url\((?:["']?)(https:\/\/fonts\.gstatic\.com\/[^)"']+)(?:["']?)\)/g,(whole,url)=>'url("'+fontMap.get(url)+'")');
  write('assets/fonts/vazirmatn.css',fontCss);
  await saveLicense('https://raw.githubusercontent.com/google/fonts/main/ofl/vazirmatn/OFL.txt','assets/fonts/Vazirmatn-OFL.txt');

  // Font Awesome Free: local CSS and every referenced webfont; no CDN fallback remains.
  const faCssUrl='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
  let faCss=await fetchText(faCssUrl);
  const faRefs=[...new Set([...faCss.matchAll(/url\((?:["']?)(\.\.\/webfonts\/[^)"']+)(?:["']?)\)/g)].map(m=>m[1]))];
  if(!faRefs.length) throw new Error('Font Awesome stylesheet contains no expected local webfont references');
  const faMap=new Map();
  for(const ref of faRefs) {
    const assetUrl=new URL(ref,faCssUrl).href;
    const filename=decodeURIComponent(path.posix.basename(new URL(assetUrl).pathname));
    const local='/assets/vendor/fontawesome/webfonts/'+filename;
    await saveUrl(assetUrl,'assets/vendor/fontawesome/webfonts/'+filename);
    faMap.set(ref,local);
  }
  faCss=faCss.replace(/url\((?:["']?)(\.\.\/webfonts\/[^)"']+)(?:["']?)\)/g,(whole,ref)=>'url("'+faMap.get(ref)+'")');
  write('assets/vendor/fontawesome/css/all.min.css',faCss);
  await saveLicense('https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/LICENSE.txt','assets/vendor/fontawesome/LICENSE.txt');

  // Leaflet is a static library and can be hosted locally. Live OSM map tiles remain a separate service.
  const leafletBase='https://unpkg.com/leaflet@1.9.4/dist/';
  let leafletCss=await fetchText(leafletBase+'leaflet.css');
  const leafletRefs=[...new Set([...leafletCss.matchAll(/url\((?:["']?)([^)"']+)(?:["']?)\)/g)].map(m=>m[1]).filter(u=>!u.startsWith('data:')&&!u.startsWith('http:')&&!u.startsWith('https:')))];
  for(const ref of leafletRefs) {
    const assetUrl=new URL(ref,leafletBase+'leaflet.css').href;
    const relative=decodeURIComponent(new URL(assetUrl).pathname.split('/dist/')[1]);
    await saveUrl(assetUrl,'assets/vendor/leaflet/'+relative);
    leafletCss=leafletCss.split(ref).join('/assets/vendor/leaflet/'+relative);
  }
  for(const name of ['images/marker-icon.png','images/marker-icon-2x.png','images/marker-shadow.png','images/layers.png','images/layers-2x.png']) {
    const file=path.join(ROOT,'assets/vendor/leaflet',name);
    if(!fs.existsSync(file)) await saveUrl(new URL(name,leafletBase).href,'assets/vendor/leaflet/'+name);
  }
  write('assets/vendor/leaflet/leaflet.css',leafletCss);
  await saveUrl(leafletBase+'leaflet.js','assets/vendor/leaflet/leaflet.js');
  await saveLicense('https://raw.githubusercontent.com/Leaflet/Leaflet/v1.9.4/LICENSE','assets/vendor/leaflet/LICENSE');

  // OpenMoji avatars: copy the exact 20 SVGs currently offered in the profile picker.
  for(const code of animals) await saveUrl('https://cdn.jsdelivr.net/npm/openmoji@17.0.0/color/svg/'+code+'.svg','assets/avatars/openmoji/'+code+'.svg');
  await saveLicense('https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/LICENSE.txt','assets/avatars/openmoji/LICENSE.txt');

  // Copy all unique fallback-catalog covers, then point the static JSON and RSS artwork at NightCast itself.
  const podcastData=JSON.parse(read('users/data/podcasts.json'));
  const coverUrls=[...new Set((podcastData.podcasts||[]).map(p=>p.cover_url).filter(url=>typeof url==='string'&&url.startsWith('https://raw.githubusercontent.com/NightCastir/NightCast-Media/main/covers/')))];
  if(!coverUrls.length) throw new Error('No NightCast-Media cover URLs were found in the fallback podcast catalog');
  const coverMap=new Map();
  for(const url of coverUrls) {
    const local=localCoverPath(url);
    await saveUrl(url,local.slice(1));
    coverMap.set(url,local);
  }
  for(const podcast of podcastData.podcasts||[]) if(coverMap.has(podcast.cover_url)) podcast.cover_url=coverMap.get(podcast.cover_url);
  write('users/data/podcasts.json',JSON.stringify(podcastData,null,2)+'\n');
  let rss=read('users/data/podcasts.xml');
  rss=rss.replace(/https:\/\/raw\.githubusercontent\.com\/NightCastir\/NightCast-Media\/main\/covers\/([A-Za-z0-9._-]+)/g,'https://nightcast.ir/assets/podcasts/covers/$1');
  write('users/data/podcasts.xml',rss);

  // Replace theme photo CDN URLs with local files in the theme controller and palette CSS.
  let themeJs=read('js/nightcast-theme.js');
  for(const [id,photo] of Object.entries(themes)) {
    const re=new RegExp('https://images\\.unsplash\\.com/'+photo+'\\?[^"\\s,]+','g');
    themeJs=themeJs.replace(re,'/assets/themes/'+id+'.jpg');
  }
  if(/images\.unsplash\.com/.test(themeJs)) throw new Error('An Unsplash URL remains in js/nightcast-theme.js');
  write('js/nightcast-theme.js',themeJs);
  let themeCss=read('css/nightcast-themes.css');
  for(const [id,photo] of Object.entries(themes)) {
    const re=new RegExp('https://images\\.unsplash\\.com/'+photo+'\\?[^"\\s)]+','g');
    themeCss=themeCss.replace(re,'/assets/themes/'+id+'.jpg');
  }
  if(/images\.unsplash\.com/.test(themeCss)) throw new Error('An Unsplash URL remains in css/nightcast-themes.css');
  write('css/nightcast-themes.css',themeCss);

  // Remove CDN preconnects and external font/icon links from every HTML page; add local equivalents only once.
  const htmlFiles=[];
  function findHtml(dir) {
    for(const item of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})) {
      if(item.isDirectory()&&['.git','node_modules','.wrangler'].includes(item.name)) continue;
      const rel=path.posix.join(dir,item.name);
      if(item.isDirectory()) findHtml(rel);
      else if(/\.html?$/i.test(item.name)) htmlFiles.push(rel);
    }
  }
  for(const top of ['.']) {
    for(const item of fs.readdirSync(ROOT,{withFileTypes:true})) {
      if(item.isDirectory()&&['.git','node_modules','.wrangler','.github','assets','css','docs','js','tests'].includes(item.name)) continue;
      const rel=item.name;
      if(item.isDirectory()) findHtml(rel);
      else if(/\.html?$/i.test(rel)) htmlFiles.push(rel);
    }
  }
  for(const file of [...new Set(htmlFiles)]) {
    let html=read(file);
    html=html.replace(/<link\b(?=[^>]*\brel=["']preconnect["'])(?=[^>]*\bhref=["']https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com)[^"']*["'])[^>]*>\s*/gi,'');
    html=html.replace(/<link\b(?=[^>]*\bhref=["']https:\/\/fonts\.googleapis\.com\/css\?[^"']*["'])[^>]*>\s*/gi,'');
    html=html.replace(/<link\b(?=[^>]*\bhref=["']https:\/\/(?:cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/|cdn\.jsdelivr\.net\/npm\/@fortawesome\/fontawesome-free@)[^"']*["'])[^>]*>\s*/gi,'');
    html=html.replace(/<link\b(?=[^>]*\bhref=["']https:\/\/(?:cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com)[^"']*["'])(?=[^>]*\brel=["']stylesheet["'])[^>]*>\s*/gi,'');
    html=html.replace(/\n{3,}/g,'\n\n');
    const wantsFont=/lang=["']fa|Vazirmatn|fonts\.googleapis\.com/i.test(html);
    const wantsIcons=/\bfa-(?:solid|regular|brands)\b|Font Awesome/i.test(html);
    const links=[];
    if(wantsFont&&!html.includes('/assets/fonts/vazirmatn.css')) links.push('  <link rel="stylesheet" href="/assets/fonts/vazirmatn.css">');
    if(wantsIcons&&!html.includes('/assets/vendor/fontawesome/css/all.min.css')) links.push('  <link rel="stylesheet" href="/assets/vendor/fontawesome/css/all.min.css">');
    if(links.length) {
      if(!/<\/head>/i.test(html)) throw new Error('Cannot inject local asset stylesheets; missing </head> in '+file);
      html=html.replace(/<\/head>/i,links.join('\n')+'\n</head>');
    }
    write(file,html);
  }

  // Replace runtime library URLs and OpenMoji avatar URLs.
  let cosmos=read('js/nightcast-cosmos.js');
  cosmos=cosmos.replaceAll('https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.7.2/css/all.min.css','/assets/vendor/fontawesome/css/all.min.css');
  cosmos=cosmos.replaceAll('link[href*="fontawesome-free@6.7.2"]','link[href*="/assets/vendor/fontawesome/css/all.min.css"]');
  cosmos=cosmos.replace('Font Awesome CDN fallback: the primary cdnjs URL may be blocked on some networks.','Self-hosted Font Awesome stylesheet fallback for pages that construct icons dynamically.');
  write('js/nightcast-cosmos.js',cosmos);
  let experience=read('js/nightcast-theme-experience.js');
  experience=experience.replace('const openMoji = code => "https://cdn.jsdelivr.net/npm/openmoji@17.0.0/color/svg/" + code + ".svg";','const openMoji = code => "/assets/avatars/openmoji/" + code + ".svg";');
  experience=experience.replace('const photo=custom||getPhoto(user);','const photo=custom ? custom.replace(/^https?:\\/\\/cdn\\.jsdelivr\\.net\\/npm\\/openmoji@17\\.0\\.0\\/color\\/svg\\//,"/assets/avatars/openmoji/") : getPhoto(user);');
  experience=experience.replace('custom===openMoji(b.dataset.avatarCode)','custom.replace(/^https?:\\/\\/cdn\\.jsdelivr\\.net\\/npm\\/openmoji@17\\.0\\.0\\/color\\/svg\\//,"/assets/avatars/openmoji/")===openMoji(b.dataset.avatarCode)');
  if(!experience.includes('const openMoji = code => "/assets/avatars/openmoji/" + code + ".svg";')) throw new Error('OpenMoji local path was not applied');
  write('js/nightcast-theme-experience.js',experience);
  let player=read('js/nightcast-player.js');
  player=player.replaceAll('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css','/assets/vendor/leaflet/leaflet.css').replaceAll('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js','/assets/vendor/leaflet/leaflet.js');
  if(player.includes('https://unpkg.com/leaflet@1.9.4')) throw new Error('Leaflet CDN URL remains in player controller');
  write('js/nightcast-player.js',player);

  // The canonical app can receive cover URLs from D1 as well as the fallback JSON.
  let app=read('js/nightcast-app.js');
  app=app.replace('const placeholder =\n                "https://placehold.co/600x600/11233A/E9BE70?text=NightCast";',
    'const placeholder = "/assets/icons/icon-512.png";\n            const localizeCover = value => {\n                const raw = String(value || "");\n                try {\n                    const url = new URL(raw, window.location.href);\n                    if (url.hostname === "raw.githubusercontent.com" && url.pathname.startsWith("/NightCastir/NightCast-Media/main/covers/")) {\n                        const filename = decodeURIComponent(url.pathname.split("/").pop());\n                        if (/^[A-Za-z0-9._-]+$/.test(filename)) return "/assets/podcasts/covers/" + filename;\n                    }\n                } catch (_) {}\n                return raw;\n            };');
  app=app.replaceAll('String(podcast.cover_url || placeholder)','(localizeCover(podcast.cover_url) || placeholder)');
  app=app.replaceAll('String(p.cover_url || placeholder)','(localizeCover(p.cover_url) || placeholder)');
  app=app.replace(/p\.cover_url\s*\|\|\s*placeholder/g,'localizeCover(p.cover_url) || placeholder');
  app=app.replaceAll('state.current.cover_url ||','localizeCover(state.current.cover_url) ||');
  app=app.replaceAll('String(p.cover_url || "https://nightcast.ir/logo.png")','(localizeCover(p.cover_url) || placeholder)');
  if(app.includes('https://placehold.co/600x600/11233A/E9BE70')) throw new Error('Remote placeholder image remains in canonical app');
  write('js/nightcast-app.js',app);
  let oldPlayer=read('users/js/player.js');
  oldPlayer=oldPlayer.replace(/cover\.src\s*=\s*podcast\.cover_url\s*\|\|\s*["']\/users\/assets\/images\/default-cover\.jpg["'];?/,
    'const coverUrl = String(podcast.cover_url || "");\ncover.src = coverUrl.startsWith("https://raw.githubusercontent.com/NightCastir/NightCast-Media/main/covers/")\n  ? "/assets/podcasts/covers/" + decodeURIComponent(new URL(coverUrl).pathname.split("/").pop())\n  : (coverUrl || "/assets/icons/icon-512.png");');

  // Update regression checks so they validate local assets instead of the old CDN implementation.
  let themeTest=read('tests/theme-system-acceptance.cjs');
  themeTest=themeTest.replaceAll("includes('unsplash.com')","includes('/assets/themes/')");
  themeTest=themeTest.replaceAll("includes('images.unsplash.com')","includes('/assets/themes/')");
  themeTest=themeTest.replaceAll('Unsplash CDN image downloads successfully for ','Local theme artwork loads successfully for ');
  themeTest=themeTest.replaceAll('selected Unsplash texture is actually applied to page for ','local theme texture is actually applied to page for ');
  themeTest=themeTest.replaceAll('selected Unsplash texture is actually applied to podcast card for ','local theme texture is actually applied to podcast card for ');
  write('tests/theme-system-acceptance.cjs',themeTest);

  let acceptance=read('tests/nightcast-acceptance.cjs');
  const start=acceptance.indexOf('      const hasPrimaryCdn = ');
  const end=acceptance.indexOf("report('0.5.",start);
  if(start<0||end<0) throw new Error('Could not locate legacy Font Awesome CDN assertion block in acceptance suite');
  const localIconChecks=`      const hasLocalIconStylesheet = /href=["'][^"']*\\/assets\\/vendor\\/fontawesome\\/css\\/all\\.min\\.css["']/i.test(html);
      const hasExternalIconCdn = /(?:cdnjs\\.cloudflare\\.com\\/ajax\\/libs\\/font-awesome|cdn\\.jsdelivr\\.net\\/npm\\/@fortawesome\\/fontawesome-free)/i.test(html);
      if (!hasLocalIconStylesheet || hasExternalIconCdn) {
        iconCdnFailures.push(file + ' must use the self-hosted Font Awesome stylesheet with no CDN dependency');
      }
    }
`;
  acceptance=acceptance.slice(0,start)+localIconChecks+acceptance.slice(end);
  acceptance=acceptance.replace("report('0.5. Font Awesome fallback loads only if the primary CDN fails'","report('0.5. Font Awesome uses self-hosted assets without CDN fallback'");
  acceptance=acceptance.replace(/const leafLetRequests = resources\.filter\(item => .*?;\n/, "const leafLetRequests = resources.filter(item => /assets\/vendor\/leaflet\//i.test(item.name));\n");
  acceptance=acceptance.replace('iconCdnFallback: !!document.querySelector(\'link[href*="fontawesome-free@6.7.2"]\'),','localIconStylesheet: !!document.querySelector(\'link[href*="/assets/vendor/fontawesome/css/all.min.css"]\'),');
  acceptance=acceptance.replace('headerState.iconFontLoaded && headerState.iconCdnFallback &&','headerState.iconFontLoaded && headerState.localIconStylesheet &&');
  write('tests/nightcast-acceptance.cjs',acceptance);

  // Keep all newly copied assets discoverable and include their license/attribution notes.
  write('assets/podcasts/covers/README.md','# Local podcast cover art\n\nThese files were copied from the NightCast-Media repository so the public archive can serve artwork from the NightCast site origin. Podcast audio remains a separate media stream.\n');
  console.log('MIGRATION COMPLETE | themes='+Object.keys(themes).length+' avatars='+animals.length+' podcast_covers='+coverUrls.length+' font_subsets='+fontUrls.length+' fontawesome_webfonts='+faRefs.length+' leaflet_images='+leafletRefs.length);
}
main().catch(error=>{console.error(error.stack||error);process.exit(1);});
