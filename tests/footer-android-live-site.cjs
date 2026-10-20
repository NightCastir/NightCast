const target = 'https://nightcast.ir/';
const cssUrl = 'https://nightcast.ir/css/nightcast-themes.css?v=10';
const failures = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function request(url) {
  return fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Mozilla/5.0 NightCastFooterAcceptance/1.0', 'cache-control': 'no-cache' } });
}
(async () => {
  let pageResponse, html = '';
  for (let attempt = 1; attempt <= 18; attempt++) {
    try {
      pageResponse = await request(target);
      html = await pageResponse.text();
      const ready = pageResponse.ok && html.includes('nc-footer-download') && html.includes('https://www.nightcast.ir/downloadrelease/NightCast.apk') && html.includes('https://cafebazaar.ir/app/ir.nightcast.app') && html.includes('nightcast-themes.css?v=10');
      console.log((ready ? 'PASS' : 'WAIT') + ' | live homepage deploy check | attempt ' + attempt + ' | HTTP ' + pageResponse.status + ' | footer=' + html.includes('nc-footer-download') + ' | theme-css-v9=' + html.includes('nightcast-themes.css?v=10'));
      if (ready) break;
      if (attempt === 18) failures.push('live homepage does not yet contain the merged Android footer panel and stylesheet cache version');
    } catch (error) {
      console.log('WAIT | live homepage deploy check | attempt ' + attempt + ' | ' + error.message);
      if (attempt === 18) failures.push('live homepage probe failed: ' + error.message);
    }
    await pause(5000);
  }
  if (pageResponse && pageResponse.ok) {
    try {
      const cssResponse = await request(cssUrl);
      const css = await cssResponse.text();
      const cssReady = cssResponse.ok && css.includes('.nc-footer-download') && css.includes('.nc-footer-download-button:focus-visible') && css.includes('prefers-reduced-motion');
      console.log((cssReady ? 'PASS' : 'FAIL') + ' | live theme CSS v10 contains CTA visual/accessibility styles | HTTP ' + cssResponse.status);
      if (!cssReady) failures.push('live theme CSS v10 is missing the Android footer CTA rules');
    } catch (error) {
      failures.push('live theme stylesheet probe failed: ' + error.message);
    }
  }
  if (failures.length) {
    console.error('Live NightCast footer deployment failures:\n' + failures.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('SUMMARY | Live NightCast homepage and footer stylesheet verified.');
  }
})();