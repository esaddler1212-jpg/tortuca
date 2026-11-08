import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const app = path.join(root, 'flight-nemulator');

const required = [
  'package.json',
  'src/main.ts',
  'src/game-loop.ts',
  'src/hero-roster.ts',
  'src/earth-planet.ts',
  'src/earth-orbit.ts',
  'src/world-reset.ts',
  'src/player-role.ts',
  'src/faction-npcs.ts',
  'src/city-integrity.ts',
  'src/villain-annihilate.ts',
  'src/solar-space-charge.ts',
  'src/villain-roster.ts',
  'src/aerial-mobility.ts',
  'src/roster-mutations.ts',
  'src/hero-customization.ts',
  'src/hero-pair-boss.ts',
  'src/hero-alignment.ts',
  'src/hero-absorption.ts',
  'src/hero-symbiote.ts',
  'src/hero-venom-bond.ts',
  'src/solar-lantern-arc.ts',
  'src/hero-rivals.ts',
  'src/world-fate.ts',
  'src/world-persist.ts',
  'src/world-theme.ts',
  'src/build-monuments.ts',
  'public/manifest-updates.json'
];

for (const f of required) {
  if (!existsSync(path.join(app, f))) {
    console.error(`flight-nemulator missing ${f}`);
    process.exit(1);
  }
}

const loadouts = spawnSync('npx', ['tsx', path.join(root, 'scripts/check-hero-loadouts.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (loadouts.status !== 0) process.exit(loadouts.status ?? 1);

const story = spawnSync('npx', ['tsx', path.join(root, 'scripts/check-story-mechanics.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (story.status !== 0) process.exit(story.status ?? 1);

const pairBoss = spawnSync('npx', ['tsx', path.join(root, 'scripts/check-pair-boss.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (pairBoss.status !== 0) process.exit(pairBoss.status ?? 1);

const audit = spawnSync('npx', ['tsx', path.join(root, 'scripts/audit-aerial-roster.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (audit.status !== 0) process.exit(audit.status ?? 1);

const build = spawnSync('npm', ['run', 'build'], { cwd: app, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

console.log('check-flight-nemulator: ok');
