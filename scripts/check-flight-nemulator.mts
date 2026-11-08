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
  'public/manifest-updates.json'
];

for (const f of required) {
  if (!existsSync(path.join(app, f))) {
    console.error(`flight-nemulator missing ${f}`);
    process.exit(1);
  }
}

const build = spawnSync('npm', ['run', 'build'], { cwd: app, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

console.log('check-flight-nemulator: ok');
