'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const app = fs.readFileSync('js/nightcast-app-v5.js', 'utf8');
const appMirror = fs.readFileSync('js/nightcast-app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('css/nightcast-base.css', 'utf8');

function check(name, condition) {
  assert.ok(condition, name);
  console.log('PASS | ' + name);
}

check('Active and mirrored app scripts stay identical', app === appMirror);
check('Podcast cards render a share icon beside the other actions', app.includes('class="favorite nc-share-button" data-action="share" data-id='));
check('Card share action invokes the sharing handler', /action === "share"\)\s*\{\s*sharePodcast\(id\);/.test(app));
check('Bottom player includes a share button beside the favorite button', /id="ncPlayerLike"[\s\S]{0,500}id="ncPlayerShare"/.test(html));
check('Expanded player includes a share action', /id="ncNowShare" data-action="share-current"/.test(html));
check('Share action uses native share sheet when available', app.includes('typeof navigator.share === "function"') && app.includes('await navigator.share(shareData)'));
check('Clipboard and manual-copy fallbacks are present', app.includes('navigator.clipboard?.writeText(url)') && app.includes('window.prompt("لینک اختصاصی این پادکست را کپی کنید:", url)'));
check('Deep link resolves both podcast ID and slug', /String\(item.id\) === sharedValue \|\| String\(item.slug \|\| ""\) === sharedValue/.test(app));
check('Deep link opens details and attempts to play the selected podcast', /openPodcastDetails\(podcast.id\);\s*playPodcast\(podcast.id\);/.test(app));
check('Deep-link processing waits for the catalogue to load', /archiveReady\.then\(\(\) => \{[\s\S]{0,250}openSharedPodcastFromUrl\(\);/.test(app));
check('Share buttons have responsive, visible focus styles', css.includes('.card-footer .nc-share-button') && css.includes('.nc-player-share:focus-visible'));

const match = app.match(/function buildPodcastShareUrl\(podcast\) \{[\s\S]*?\n            \}/);
assert.ok(match, 'Share URL builder function was not found');
const builder = vm.runInNewContext(
  '(' + match[0] + ')',
  { URL, window: { location: { origin: 'https://nightcast.ir' } } }
);
const slugUrl = new URL(builder({ id: 91001, slug: 'podcast-91001' }));
check('Share URL uses the canonical NightCast origin', slugUrl.origin === 'https://nightcast.ir');
check('Share URL points to the selected podcast slug', slugUrl.searchParams.get('podcast') === 'podcast-91001');
check('Share URL requests playback on arrival', slugUrl.searchParams.get('autoplay') === '1');
const idUrl = new URL(builder({ id: 91002 }));
check('Share URL falls back to the podcast ID if no slug exists', idUrl.searchParams.get('podcast') === '91002');

console.log('SUMMARY | 15/15 podcast sharing assertions passed');
