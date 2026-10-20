const targets = [
  { name: 'Direct APK download', url: 'https://www.nightcast.ir/downloadrelease/NightCast.apk', method: 'HEAD' },
  { name: 'Cafe Bazaar listing', url: 'https://cafebazaar.ir/app/ir.nightcast.app', method: 'GET' }
];
(async () => {
  let failed = false;
  for (const target of targets) {
    try {
      const response = await fetch(target.url, {
        method: target.method,
        redirect: 'follow',
        signal: AbortSignal.timeout(25000),
        headers: target.method === 'GET' ? { 'user-agent': 'Mozilla/5.0 NightCastAcceptance/1.0' } : {}
      });
      const ok = response.status >= 200 && response.status < 400;
      console.log((ok ? 'PASS' : 'FAIL') + ' | ' + target.name + ' | HTTP ' + response.status + ' | ' + response.url);
      if (!ok) failed = true;
      if (response.body) await response.body.cancel().catch(() => {});
    } catch (error) {
      console.log('FAIL | ' + target.name + ' | ' + error.message);
      failed = true;
    }
  }
  if (failed) {
    console.error('One or more live Android download destinations are not reachable.');
    process.exitCode = 1;
  } else {
    console.log('SUMMARY | Both Android download destinations are reachable.');
  }
})();