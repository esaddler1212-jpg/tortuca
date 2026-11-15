#!/usr/bin/env node
/**
 * Copies games-hub build (City Nights + Battleworld / Flight Nemulator) into public/console/
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const boysRoot = path.resolve(here, '..');
const repoRoot = path.resolve(boysRoot, '..');
const hubDir = path.join(repoRoot, 'games-hub');
const dest = path.join(boysRoot, 'public', 'console');

function run(cmd, args, cwd, extraEnv) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv }
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log('→ Building Tortuca Console (games-hub build:all)…');
run('npm', ['ci'], hubDir);
run('npm', ['run', 'build:all'], hubDir, { VITE_BATTLEWORLD_OFFLINE_BUNDLE: '1' });

if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(path.join(hubDir, 'dist'), dest, { recursive: true });
console.log(`✓ Bundled console → vantage-games/public/console (${dest})`);
