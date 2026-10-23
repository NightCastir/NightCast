'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const workerPath = 'workers/club-api-entry.js';
const worker = fs.readFileSync(workerPath, 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const gate = fs.readFileSync('js/club-admin.js', 'utf8');
const adminPage = fs.readFileSync('club-admin.html', 'utf8');

function check(name, condition) {
  console.log((condition ? 'PASS' : 'FAIL') + ' | ' + name);
  assert.ok(condition, name);
}

const syntax = spawnSync(process.execPath, ['--input-type=module', '--check'], {
  input: worker,
  encoding: 'utf8'
});
check('club API Worker entry parses as an ES module', syntax.status === 0);

check('admin session resolves the stored email column, not username', /SELECT admins\.id, admins\.username, admins\.full_name, admins\.email[\s\S]*?FROM admin_sessions[\s\S]*?INNER JOIN admins[\s\S]*?WHERE admin_sessions\.session_token/.test(worker));
check('allowlist is read only from Worker environment secrets', /env\.ADMIN_EMAIL\s*\|\|\s*env\.ADMIN/.test(worker));
check('email comparison is case-insensitive and whitespace-trimmed', /String\(user\.email\s*\|\|\s*""\)\.trim\(\)\.toLowerCase\(\)\s*===\s*configuredAdminEmail/.test(worker));
check('non-allowlisted users are explicitly downgraded to user role', /role:\s*isAllowlisted\s*\?\s*"admin"\s*:\s*"user"/.test(worker));
check('dedicated status endpoint exists', /\/api\/v1\/club\/admin\/status/.test(worker));
check('status endpoint returns no-store responses', /"Cache-Control":\s*"no-store"/.test(worker));
check('status endpoint fails closed when Worker allowlist is missing', /if \(!configuredAdminEmail\)\s*\{\s*return json\(\{ success: true, isAdmin: false, code: "admin_allowlist_not_configured" \}, 503\)/.test(worker));
check('status endpoint requires a valid allowlisted actor for isAdmin=true', /actor &&[\s\S]*?actor\.role[\s\S]*?actor\.email[\s\S]*?=== configuredAdminEmail/.test(worker));
check('desktop admin navigation starts hidden', /id="ncAdminDesktopLink"[^>]*hidden/.test(home));
check('mobile drawer admin navigation starts hidden', /id="ncAdminDrawerLink"[^>]*hidden/.test(home));
check('navigation calls the server-side status endpoint', /\/api\/v1\/club\/admin\/status/.test(home));
check('navigation never trusts cached client role or email to expose admin link', !/NightCastUser.*(?:role|email).*admin/i.test(home));
check('navigation only reveals links after a positive server isAdmin response', /showLinks\(response\.ok && data\.isAdmin === true\)/.test(home));
check('navigation fails closed on network/API errors', /\.catch\(function \(\) \{\s*showLinks\(false\);/.test(home));
check('admin page verifies authorization before loading overview', gate.indexOf('verifyAdminAllowlist().then(load)') > gate.indexOf('async function verifyAdminAllowlist'));
check('admin dashboard remains hidden unless API verification succeeds', /\$\("dashboard"\)\.hidden\s*=\s*true/.test(gate));
check('admin document does not expose any secret value', !/ADMIN_EMAIL\s*[:=]\s*["'][^"']+["']/.test(adminPage));

console.log('SUMMARY | PASS | 17 admin-email authorization checks');
