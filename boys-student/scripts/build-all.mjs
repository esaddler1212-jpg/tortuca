#!/usr/bin/env node
/**
 * Build Battleworld portal: landing shell + Flight Nemulator static bundle.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const portalDir = path.resolve(root, '..');
const repoRoot = path.resolve(portalDir, '..');
const portalDist = path.join(portalDir, 'dist');
const gamePkg = 'flight-nemulator';
const outName = 'flight-nemulator';

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function rimraf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

console.log('→ Building Battleworld portal shell…');
run('npm', ['run', 'build'], portalDir);

const appDir = path.join(repoRoot, gamePkg);
console.log(`→ Building ${gamePkg}…`);
run('npm', ['ci'], appDir);
run('npm', ['run', 'build'], appDir);

const dest = path.join(portalDist, outName);
console.log(`→ Merging ${gamePkg} into dist/${outName}/…`);
rimraf(dest);
fs.cpSync(path.join(appDir, 'dist'), dest, { recursive: true });

console.log('✓ Battleworld portal ready in boys-student/dist/');
