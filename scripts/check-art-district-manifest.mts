#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'shared/art-district-manifest.json'), 'utf8')) as {
  cityNights: { id: string; kitModule: string; anchorConst: string }[];
};
const world = readFileSync(join(root, 'drive-world/src/build-world.ts'), 'utf8');
const kenney = readFileSync(join(root, 'drive-world/src/build-kenney-districts.ts'), 'utf8');
const registry = readFileSync(join(root, 'drive-world/src/landmark-registry.ts'), 'utf8');
const errors: string[] = [];

const worldCalls = [
  'buildVallejoEstateKit',
  'buildSfFerryKit',
  'buildMarinBridgeKit',
  'buildEastbayLakeKit',
  'buildPeninsulaSfoKit',
  'buildSouthbaySapKit'
];

for (const call of worldCalls) {
  if (!world.includes(call)) errors.push(`build-world.ts missing ${call}`);
}

for (const row of manifest.cityNights) {
  const file = join(root, `drive-world/src/${row.kitModule}.ts`);
  if (!existsSync(file)) errors.push(`missing ${row.kitModule}.ts`);
  else {
    const src = readFileSync(file, 'utf8');
    if (!src.includes(row.anchorConst)) errors.push(`${row.kitModule}: missing export ${row.anchorConst}`);
  }
  if (row.anchorConst in { VALLEJO_SAFEHOUSE: 1, SFO_AIRPORT_LOT: 1 }) {
    if (!registry.includes(row.anchorConst)) errors.push(`landmark-registry missing ${row.anchorConst}`);
  }
}

if (manifest.cityNights.length !== 6) errors.push(`expected 6 anchors, got ${manifest.cityNights.length}`);
if (!kenney.includes('placeSouthbaySapKenneyProps')) errors.push('kenney: placeSouthbaySapKenneyProps missing');

const rim = readFileSync(join(root, 'flight-nemulator/src/build-district-rim-lights.ts'), 'utf8');
const loop = readFileSync(join(root, 'flight-nemulator/src/game-loop.ts'), 'utf8');
if (!rim.includes('buildDistrictRimLights')) errors.push('battleworld rim lights module missing');
if (!loop.includes('buildDistrictRimLights')) errors.push('game-loop: rim lights not wired');

if (errors.length) {
  console.error('check-art-district-manifest failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('check-art-district-manifest ok (6 Bay art anchors + BW rim)');