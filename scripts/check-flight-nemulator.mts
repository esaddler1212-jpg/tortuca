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
  'src/doom-story-arc.ts',
  'src/territory-invasion.ts',
  'src/territory-tick.ts',
  'src/battleworld.ts',
  'src/battleworld-districts.ts',
  'src/battleworld-chapters.ts',
  'src/wave-combat-juice.ts',
  'src/villain-gltf.ts',
  'src/villain-gltf-paths.ts',
  'src/battleworld-lattice-cloud.ts',
  'src/hero-villain-apex.ts',
  'src/battleworld-arcs.ts',
  'src/battleworld-dialogue.ts',
  'src/battleworld-autosave.ts',
  'src/cutscene-queue.ts',
  'src/arc-progress.ts',
  'src/infinity-stones-arc.ts',
  'src/infinity-stones-tick.ts',
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

const parity = spawnSync('npx', ['tsx', path.join(root, 'scripts/check-hero-villain-parity.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (parity.status !== 0) process.exit(parity.status ?? 1);

const dialogue = spawnSync('npx', ['tsx', path.join(root, 'scripts/check-battleworld-dialogue.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (dialogue.status !== 0) process.exit(dialogue.status ?? 1);

const lattice = spawnSync('npx', ['tsx', path.join(root, 'scripts/check-battleworld-lattice.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (lattice.status !== 0) process.exit(lattice.status ?? 1);

const arcs = spawnSync('npx', ['tsx', path.join(root, 'scripts/check-battleworld-arcs.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (arcs.status !== 0) process.exit(arcs.status ?? 1);

const waveJuice = spawnSync('npx', ['tsx', path.join(root, 'scripts/check-wave-combat-juice.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (waveJuice.status !== 0) process.exit(waveJuice.status ?? 1);

const chapters = spawnSync('npx', ['tsx', path.join(root, 'scripts/check-battleworld-chapters.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (chapters.status !== 0) process.exit(chapters.status ?? 1);

const infinity = spawnSync('npx', ['tsx', path.join(root, 'scripts/check-infinity-stones.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (infinity.status !== 0) process.exit(infinity.status ?? 1);

const territory = spawnSync('npx', ['tsx', path.join(root, 'scripts/check-territory-invasion.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (territory.status !== 0) process.exit(territory.status ?? 1);

const audit = spawnSync('npx', ['tsx', path.join(root, 'scripts/audit-aerial-roster.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (audit.status !== 0) process.exit(audit.status ?? 1);

const build = spawnSync('npm', ['run', 'build'], { cwd: app, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

console.log('check-flight-nemulator: ok');
