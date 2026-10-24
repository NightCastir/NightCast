'use strict';

const fs = require('node:fs');
const assert = require('node:assert/strict');

const config = fs.readFileSync('capacitor.config.ts', 'utf8');
const workflow = fs.readFileSync('.github/workflows/build-android.yml', 'utf8');
const main = fs.readFileSync('android-template/src/main/java/ir/nightcast/app/MainActivity.java', 'utf8');
const auth = fs.readFileSync('android-template/src/main/java/ir/nightcast/app/NightCastGoogleAuth.java', 'utf8');
const login = fs.readFileSync('users/js/login.js', 'utf8');

assert.match(config, /url:\s*'https:\/\/nightcast\.ir'/, 'Capacitor must have one explicit remote entry URL');
assert.match(config, /androidScheme:\s*'https'/, 'Android WebView must use HTTPS');
assert.match(config, /allowNavigation:\s*\[[^\]]*'www\.nightcast\.ir'[^\]]*'nightcast\.ir'/s, 'Both canonical NightCast hosts must be allowed');
assert.match(login, /const fallback = "\\/podcasts"/, 'Google login must return to the canonical podcast route');
assert.match(login, /target\.origin !== window\.location\.origin/, 'Post-login navigation must remain on the active origin to preserve the session');
assert.match(login, /window\.location\.replace\(\s*this\.getPostLoginDestination\(\)\s*\)/, 'Successful login must navigate after session persistence');
assert.doesNotMatch(workflow, /cat > android\/app\/src\/main\/java\/ir\/nightcast\/app\/(?:MainActivity|NightCastGoogleAuth)\.java/, 'Java source must not be embedded in workflow YAML');
assert.match(workflow, /cp "\$SOURCE_DIR\/MainActivity\.java" "\$TARGET_DIR\/MainActivity\.java"/, 'Workflow must copy tracked MainActivity source');
assert.match(workflow, /cp "\$SOURCE_DIR\/NightCastGoogleAuth\.java" "\$TARGET_DIR\/NightCastGoogleAuth\.java"/, 'Workflow must copy tracked Google auth source');
assert.match(main, /^package ir\.nightcast\.app;/m);
assert.match(main, /extends BridgeActivity/);
assert.match(main, /registerPlugin\(NightCastGoogleAuth\.class\)/);
assert.match(auth, /^package ir\.nightcast\.app;/m);
assert.match(auth, /@CapacitorPlugin\(name = "NightCastGoogleAuth"\)/);
assert.match(auth, /public void signIn\(PluginCall call\)/);
assert.match(workflow, /GENERATED_CONFIG="android\/app\/src\/main\/assets\/capacitor\.config\.json"/, 'CI must verify the configuration copied into the built Android project');

console.log('PASS | One tracked Capacitor entry configuration');
console.log('PASS | Java source is tracked outside generated Android output');
console.log('PASS | Workflow copies tracked Java source rather than embedding it');
console.log('PASS | Native activity/plugin registration and packaged config checks remain present');
