#!/usr/bin/env node
/**
 * Build Tortuca Console: hub + City Nights + Flight Nemulator.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const hubDir = path.resolve(root, '..');
const repoRoot = path.resolve(hubDir, '..');
const hubDist = path.join(hubDir, 'dist');

const netlifyBuild = process.env.NETLIFY === 'true' || process.env.INSTALL_VISUAL_ASSETS === '1';

const siblingGames = [
  { pkg: 'drive-world', out: 'city-nights' },
  { pkg: 'flight-nemulator', out: 'flight-nemulator' }
];

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: false });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function rimraf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function mergeGame(pkg, outName) {
  const appDir = path.join(repoRoot, pkg);
  console.log(`→ Building ${pkg}…`);
  run('npm', ['ci'], appDir);
  run('npm', ['run', 'build'], appDir);
  const dest = path.join(hubDist, outName);
  console.log(`→ Merging ${pkg} into dist/${outName}/…`);
  rimraf(dest);
  fs.cpSync(path.join(appDir, 'dist'), dest, { recursive: true });
}

if (netlifyBuild) {
  console.log('→ Browser deploy: fetching CC0 visual packs…');
  run('bash', ['tools/gamedev-resources/netlify-visual-assets.sh'], repoRoot);
}

console.log('→ Building games hub shell…');
run('npm', ['run', 'build'], hubDir);

for (const { pkg, out } of siblingGames) {
  mergeGame(pkg, out);
}

console.log('✓ Tortuca Console ready in games-hub/dist/');
