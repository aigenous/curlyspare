#!/usr/bin/env node
/* global console, process */
// Fails when a dependency can only be used under GPL, AGPL, or LGPL.
// A dual licence such as "MIT OR GPL-3.0-only" is allowed, because the
// permissive alternative can be chosen. "GPL-2.0 OR GPL-3.0" is not.
//
// Usage:
//   node scripts/check-licenses.mjs            # self-test, then `pnpm licenses list --json`
//   node scripts/check-licenses.mjs --self-test
//   node scripts/check-licenses.mjs --file licenses.json

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const COPYLEFT =
  /\b(AGPL|LGPL|GPL)\b|affero|lesser general public|library general public|general public licen[cs]e/i;

function splitTopLevelOr(expression) {
  const parts = [];
  let depth = 0;
  let start = 0;
  const re = /\(|\)|\s+OR\s+/gi;
  let match = re.exec(expression);
  while (match) {
    if (match[0] === '(') {
      depth += 1;
    } else if (match[0] === ')') {
      depth -= 1;
    } else if (depth === 0) {
      parts.push(expression.slice(start, match.index));
      start = match.index + match[0].length;
    }
    match = re.exec(expression);
  }
  parts.push(expression.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

export function isCopyleftOnly(license) {
  if (typeof license !== 'string') return false;
  const expression = license.trim();
  if (!expression) return false;
  const options = splitTopLevelOr(expression);
  return options.every((option) => COPYLEFT.test(option));
}

function licenseText(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(licenseText).filter(Boolean).join(' OR ');
  if (value && typeof value === 'object') {
    if (typeof value.type === 'string') return value.type;
    if (typeof value.license === 'string') return value.license;
  }
  return '';
}

export function collectPackages(data) {
  const packages = [];
  if (!data || typeof data !== 'object') return packages;

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (!item || typeof item !== 'object') continue;
        packages.push({
          name: item.name || key,
          version: String(item.version || (Array.isArray(item.versions) ? item.versions[0] : '') || ''),
          license: licenseText(item.license ?? item.licenses) || key,
        });
      }
      continue;
    }
    if (value && typeof value === 'object' && ('license' in value || 'licenses' in value)) {
      packages.push({
        name: value.name || key,
        version: String(value.version || ''),
        license: licenseText(value.license ?? value.licenses),
      });
    }
  }
  return packages;
}

export function forbiddenPackages(data) {
  return collectPackages(data).filter((pkg) => isCopyleftOnly(pkg.license));
}

function selfTest() {
  const cases = [
    ['MIT', false],
    ['Apache-2.0', false],
    ['BSD-3-Clause', false],
    ['ISC', false],
    ['0BSD', false],
    ['Unlicense', false],
    ['MPL-2.0', false],
    ['GPL-3.0-only', true],
    ['GPL-2.0-or-later', true],
    ['LGPL-2.1-only', true],
    ['AGPL-3.0-only', true],
    ['GNU General Public License v2', true],
    ['GNU Lesser General Public License', true],
    ['GNU Affero General Public License', true],
    ['MIT OR GPL-3.0-only', false],
    ['(MIT OR Apache-2.0)', false],
    ['GPL-2.0-only OR GPL-3.0-only', true],
    ['MIT AND GPL-3.0-only', true],
    ['MIT OR (LGPL-2.1-only AND GPL-2.0-only)', false],
    ['GPL-2.0-only WITH Classpath-exception-2.0', true],
    ['', false],
  ];
  const failures = [];
  for (const [license, want] of cases) {
    const got = isCopyleftOnly(license);
    if (got !== want) failures.push(`${JSON.stringify(license)} => ${got}, expected ${want}`);
  }

  const grouped = {
    MIT: [{ name: 'ok-pkg', version: '1.0.0', license: 'MIT' }],
    'GPL-3.0-only': [{ name: 'copyleft-pkg', version: '2.0.0', license: 'GPL-3.0-only' }],
  };
  const found = forbiddenPackages(grouped);
  if (found.length !== 1 || found[0].name !== 'copyleft-pkg') {
    failures.push(`grouped scan found ${found.map((pkg) => pkg.name).join(', ') || 'nothing'}`);
  }

  const flat = forbiddenPackages({
    'dual@1.0.0': { name: 'dual', version: '1.0.0', license: 'MIT OR Apache-2.0' },
    'agpl@1.0.0': { name: 'agpl', version: '1.0.0', license: 'AGPL-3.0-or-later' },
  });
  if (flat.length !== 1 || flat[0].name !== 'agpl') {
    failures.push(`flat scan found ${flat.map((pkg) => pkg.name).join(', ') || 'nothing'}`);
  }

  if (failures.length > 0) {
    console.error('check-licenses self-test failed:');
    for (const failure of failures) console.error(`  ${failure}`);
    return false;
  }
  console.log(`check-licenses self-test passed (${cases.length + 2} cases).`);
  return true;
}

function readLicenses(file) {
  if (file) return JSON.parse(readFileSync(file, 'utf8'));
  const result = spawnSync('pnpm', ['licenses', 'list', '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stderr.write(result.stderr || '');
    throw new Error(`pnpm licenses list exited ${result.status}`);
  }
  const stdout = result.stdout.trim();
  return stdout ? JSON.parse(stdout) : {};
}

function isDirectRun() {
  const entry = process.argv[1];
  return Boolean(entry) && import.meta.url === pathToFileURL(entry).href;
}

function main() {
  const args = process.argv.slice(2);
  const selfTestOnly = args.includes('--self-test');
  const fileFlag = args.indexOf('--file');
  const file = fileFlag >= 0 ? args[fileFlag + 1] : '';

  if (!selfTest()) process.exit(1);
  if (selfTestOnly) return;

  const forbidden = forbiddenPackages(readLicenses(file));
  if (forbidden.length === 0) {
    console.log('Licence check passed: no GPL, AGPL, or LGPL-only dependencies.');
    return;
  }
  console.error(`Licence check failed: ${forbidden.length} copyleft-only dependenc${forbidden.length === 1 ? 'y' : 'ies'}:`);
  for (const pkg of forbidden) {
    console.error(`  ${pkg.name}@${pkg.version || '?'}  ${pkg.license}`);
  }
  process.exit(1);
}

if (isDirectRun()) main();
