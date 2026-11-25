/**
 * City Nights ↔ Battleworld open-world tier parity (static wiring).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dw = path.join(root, 'drive-world');
let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed = true;
};

const bayMap = fs.readFileSync(path.join(dw, 'src/hud/BayMap.tsx'), 'utf8');
ok('minimap find-next pin', bayMap.includes('minimap-find-next'));
ok('tokyo next landmark route', bayMap.includes('snap.nextLandmark'));

const hudCss = fs.readFileSync(path.join(dw, 'src/hud/hud.css'), 'utf8');
ok('find-next styles', hudCss.includes('minimap-find-next-core'));

const loop = fs.readFileSync(path.join(dw, 'src/game-loop.ts'), 'utf8');
ok('tokyo ground height spawn', loop.includes('tokyoGroundHeightM'));
ok('snap vehicle after flight', loop.includes('snapVehicleToDriveFloor'));

const photo = fs.readFileSync(path.join(dw, 'src/photo-mode.ts'), 'utf8');
ok('photo mode module', photo.length > 200);

const doc = fs.readFileSync(path.join(root, 'docs/CITY_NIGHTS_OPEN_WORLD_TIERS.md'), 'utf8');
ok('parity doc', doc.includes('Find next'));

if (failed) process.exitCode = 1;
else console.log('check-city-nights-openworld-parity: ok');