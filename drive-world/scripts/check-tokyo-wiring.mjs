#!/usr/bin/env node
/**
 * Static audit: Tokyo landmarks ↔ FF tribute cars ↔ catalog ids stay in sync.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

const landmarkIds = [...read('src/tokyo-map.ts').matchAll(/\{\s*id:\s*'(tk-[^']+)'/g)].map((m) => m[1]);
const mapPairs = [...read('src/tokyo-ff-cars.ts').matchAll(/'(tk-[^']+)':\s*'(tokyo-[^']+)'/g)].map((m) => [m[1], m[2]]);
const catalogTokyo = [...read('src/vehicle-catalog.ts').matchAll(/'(tokyo-[^']+)':\s*spec\(/g)].map((m) => m[1]);
const ffList = read('src/vehicle-catalog.ts').match(/TOKYO_FF_VEHICLE_IDS\s*=\s*\[([\s\S]*?)\]\s*as const/)?.[1] ?? '';
const ffIds = [...ffList.matchAll(/'tokyo-[^']+'/g)].map((m) => m[0].slice(1, -1));

const errors = [];

if (landmarkIds.length !== 8) errors.push(`expected 8 Tokyo landmarks, found ${landmarkIds.length}`);
if (mapPairs.length !== landmarkIds.length) errors.push(`landmark→vehicle map size ${mapPairs.length} ≠ ${landmarkIds.length}`);

for (const id of landmarkIds) {
  if (!mapPairs.some(([lm]) => lm === id)) errors.push(`missing vehicle map for landmark ${id}`);
}
for (const [lm, car] of mapPairs) {
  if (!landmarkIds.includes(lm)) errors.push(`orphan landmark key in map: ${lm}`);
  if (!catalogTokyo.includes(car)) errors.push(`catalog missing Tokyo vehicle ${car} (landmark ${lm})`);
}
for (const id of ffIds) {
  if (!catalogTokyo.includes(id)) errors.push(`TOKYO_FF_VEHICLE_IDS lists missing catalog entry ${id}`);
}
for (const id of catalogTokyo) {
  if (!ffIds.includes(id)) errors.push(`catalog Tokyo vehicle ${id} not in TOKYO_FF_VEHICLE_IDS`);
}
const mappedCars = new Set(mapPairs.map(([, c]) => c));
for (const id of ffIds) {
  if (!mappedCars.has(id)) errors.push(`FF vehicle ${id} not awarded by any landmark`);
}

if (errors.length) {
  console.error('Tokyo wiring audit FAILED:\n' + errors.map((e) => `  · ${e}`).join('\n'));
  process.exit(1);
}
console.log(`Tokyo wiring audit OK — ${landmarkIds.length} landmarks, ${ffIds.length} FF tribute cars`);
