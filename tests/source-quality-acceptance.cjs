#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const YAML = require('yaml');
const { transform } = require('lightningcss');

const ignoredDirectories = new Set(['.git', 'node_modules', 'android', 'www', '.wrangler', 'dist', 'coverage']);
const failures = [];
const counts = { javascript: 0, yaml: 0, json: 0, css: 0 };

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, files);
    else files.push(file);
  }
  return files;
}

function checkJavaScript(file) {
  const source = fs.readFileSync(file, 'utf8');
  const scriptCheck = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024
  });
  if (scriptCheck.status === 0) return;
  const moduleCheck = spawnSync(process.execPath, ['--input-type=module', '--check'], {
    input: source,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024
  });
  if (moduleCheck.status !== 0) {
    const a = (scriptCheck.stderr || scriptCheck.stdout || 'script parser failed').trim();
    const b = (moduleCheck.stderr || moduleCheck.stdout || 'module parser failed').trim();
    throw new Error('script parse: ' + a + ' | module parse: ' + b);
  }
}

for (const file of walk(process.cwd())) {
  const relative = path.relative(process.cwd(), file).split(path.sep).join('/');
  const ext = path.extname(file).toLowerCase();
  try {
    if (['.js', '.mjs', '.cjs'].includes(ext) && !relative.startsWith('tests/fixtures/')) {
      checkJavaScript(file);
      counts.javascript++;
    } else if (['.yml', '.yaml'].includes(ext)) {
      YAML.parse(fs.readFileSync(file, 'utf8'), { uniqueKeys: true });
      counts.yaml++;
    } else if (ext === '.json') {
      JSON.parse(fs.readFileSync(file, 'utf8'));
      counts.json++;
    } else if (ext === '.css') {
      transform({ filename: relative, code: Buffer.from(fs.readFileSync(file, 'utf8')) });
      counts.css++;
    }
  } catch (error) {
    failures.push(relative + ': ' + String(error.message || error).replace(/\s+/g, ' ').slice(0, 1200));
  }
}

for (const [kind, count] of Object.entries(counts)) {
  console.log((failures.some(item => item.startsWith(kind + '/')) ? 'CHECK' : 'INFO') +
    ' | ' + kind + ' files inspected: ' + count);
}
for (const failure of failures) console.error('FAIL | ' + failure);
console.log('SUMMARY | ' + (failures.length === 0 ? 'PASS' : 'FAIL') +
  ' | ' + (counts.javascript + counts.yaml + counts.json + counts.css) + ' files checked' +
  ' | failures=' + failures.length);
if (failures.length) process.exitCode = 1;
