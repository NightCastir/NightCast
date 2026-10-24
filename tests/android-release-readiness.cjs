'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const read = (file) => fs.readFileSync(file, 'utf8');
const version = JSON.parse(read('version.json')).version;
const packageJson = JSON.parse(read('package.json'));
const root = read('index.html');
const loginPage = read('users/login.html');
const legacyLoginPage = read('login/index.html');
const loginScript = read('users/js/login.js');
const nativeAuth = read('android-template/src/main/java/ir/nightcast/app/NightCastGoogleAuth.java');
const mainActivity = read('android-template/src/main/java/ir/nightcast/app/MainActivity.java');
const buildWorkflow = read('.github/workflows/build-android.yml');
const bazaarWorkflow = read('.github/workflows/cafebazaar-release-apk.yml');

assert.match(version, /^\d+\.\d+\.\d+$/, 'version.json must contain a semantic release version');
assert.equal(packageJson.version, version, 'package.json and version.json must use the same release version');

const [major, minor, patch] = version.split('.').map(Number);
const versionCode = major * 10000 + minor * 100 + patch;
assert.ok(Number.isSafeInteger(versionCode) && versionCode >= 40100, 'Android versionCode must be valid and meet Cafe Bazaar minimum');
console.log('PASS | Version files aligned | ' + version + ' / ' + versionCode);

assert.match(root, /\/js\/nightcast-app-v5\.js\?v=8(?:["'])/, 'Root archive must invalidate the stale app bundle cache');
assert.ok(loginPage.includes('/users/js/login.js?v=20261024-native-google-fix1'), 'Canonical login must load the native Google fix');
assert.ok(legacyLoginPage.includes('/users/js/login.js?v=20261024-native-google-fix1'), 'Legacy login must load the same fixed login script');
assert.ok(loginScript.includes('this.setupNativeGoogle();'), 'Android WebView must select native Google login');
assert.ok(loginScript.includes('await plugin.signIn()'), 'Login page must invoke the native Credential Manager plugin');
assert.ok(loginScript.includes('/public/openid/google'), 'Google ID token must be exchanged with the NightCast API');
assert.doesNotMatch(loginScript, /Native Google Sign-In Result:\s*["']?\s*,\s*result/, 'Never log the Google ID token payload');
assert.match(nativeAuth, /GetSignInWithGoogleOption/);
assert.match(nativeAuth, /GoogleIdTokenCredential\.createFrom/);
assert.match(mainActivity, /registerPlugin\(NightCastGoogleAuth\.class\)/);
console.log('PASS | Android Google login route, token exchange and sensitive-log guard');

const nodeBlock = bazaarWorkflow.match(/node <<'NODE'\r?\n([\s\S]*?)\r?\n {10}NODE/);
assert.ok(nodeBlock, 'Cafe Bazaar release workflow must have a version-validation Node script');
const inlineNode = nodeBlock[1].replace(/^ {10}/gm, '');
new vm.Script(inlineNode, { filename: 'cafebazaar-release-version-check.js' });
console.log('PASS | Cafe Bazaar workflow inline Node syntax');

assert.ok(
  bazaarWorkflow.includes("s = s[:end + 1] + '\\n    <uses-permission"),
  'Android manifest permission insertion must use a real Python newline escape'
);
assert.ok(
  bazaarWorkflow.includes("s = s.replace('</application>', receiver + '\\n    </application>')"),
  'Android manifest receiver insertion must use a real Python newline escape'
);
assert.ok(
  !bazaarWorkflow.includes("s = s[:end + 1] + '\\\\n    <uses-permission"),
  'Do not inject literal backslash-n text into AndroidManifest.xml'
);
assert.ok(bazaarWorkflow.includes('"$APKSIGNER" verify --verbose "$APK"'));
assert.ok(bazaarWorkflow.includes('"$ZIPALIGN" -c -v 4 "$APK"'));
assert.ok(bazaarWorkflow.includes('NightCast-Bazaar-Release-APK-v'));
assert.ok(buildWorkflow.includes('node tests/android-release-readiness.cjs'), 'Main APK build must run this release gate');
console.log('PASS | Cafe Bazaar APK signature/alignment checks and build gate');
