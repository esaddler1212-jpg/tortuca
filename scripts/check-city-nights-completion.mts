/**
 * City Nights family-complete gate (browser couch).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANDMARKS } from '../drive-world/src/landmark-registry.ts';

const root = join(import.meta.dirname, '..');
const dw = join(root, 'drive-world');

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed = true;
};

const oracle = LANDMARKS.find((l) => l.id === 'oracle-park');
const chase = LANDMARKS.find((l) => l.id === 'chase-center');
ok('landmarks loaded', Boolean(oracle && chase));
if (oracle && chase) {
  const sep = Math.hypot(oracle.x - chase.x, oracle.z - chase.z);
  ok('oracle/chase separation ≥ 50m', sep >= 50);
}

const playlist = JSON.parse(readFileSync(join(dw, 'public/music/playlist.json'), 'utf8')) as {
  tracks: unknown[];
};
ok('music playlist non-empty', playlist.tracks.length >= 4);
for (const t of playlist.tracks as { file: string }[]) {
  ok(`track ${t.file}`, existsSync(join(dw, 'public/music', t.file)));
}

const hud = readFileSync(join(dw, 'src/hud/hud.css'), 'utf8');
ok('reduced-motion vista pulse', hud.includes('.minimap-vista-pulse') && hud.includes('prefers-reduced-motion'));

const progress = readFileSync(join(dw, 'src/game-progress.ts'), 'utf8');
ok('sprint top-3 save field', progress.includes('landmarkSprintTop3'));

ok('CITY_NIGHTS_COMPLETE doc', existsSync(join(root, 'docs/CITY_NIGHTS_COMPLETE.md')));

if (existsSync(join(root, 'scripts/check-landmark-sprint-board.mts'))) {
  const r = spawnSync('npx', ['tsx', join(root, 'scripts/check-landmark-sprint-board.mts')], {
    cwd: root,
    stdio: 'inherit',
  });
  ok('landmark sprint board check', r.status === 0);
}

if (failed) process.exitCode = 1;
else console.log('check-city-nights-completion: ok');