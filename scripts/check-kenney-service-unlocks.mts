#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const errors: string[] = [];

const unlockPath = join(root, 'drive-world/src/vehicle-kenney-service-unlocks.ts');
if (!existsSync(unlockPath)) errors.push('missing vehicle-kenney-service-unlocks.ts');

const catalog = readFileSync(join(root, 'drive-world/src/vehicle-catalog.ts'), 'utf8');
const paths = readFileSync(join(root, 'drive-world/src/vehicle-gltf-paths.ts'), 'utf8');
const gltf = readFileSync(join(root, 'drive-world/src/vehicle-gltf.ts'), 'utf8');
const loop = readFileSync(join(root, 'drive-world/src/game-loop.ts'), 'utf8');
const missions = readFileSync(join(root, 'drive-world/src/game-missions.ts'), 'utf8');

const ids = [
  'bonus-night-medic',
  'bonus-fire-watch',
  'bonus-route-collect',
  'bonus-peninsula-luxe'
] as const;

if (!catalog.includes('BONUS_KENNEY_SERVICE_IDS')) errors.push('vehicle-catalog: BONUS_KENNEY_SERVICE_IDS missing');
for (const id of ids) {
  if (!catalog.includes(`'${id}'`)) errors.push(`vehicle-catalog: ${id} missing`);
  if (!paths.includes(`'${id}'`)) errors.push(`vehicle-gltf-paths: ${id} missing`);
  if (!gltf.includes(`'${id}'`)) errors.push(`vehicle-gltf: visual opts for ${id} missing`);
  if (!unlockPath || !readFileSync(unlockPath, 'utf8').includes(`'${id}'`)) {
    errors.push(`kenney service unlocks: ${id} missing`);
  }
}

if (!loop.includes('tryUnlockKenneyServiceVehicles')) errors.push('game-loop: kenney service unlock hook missing');
if (!missions.includes('KENNEY_SERVICE_UNLOCKS')) errors.push('game-missions: service fleet hints missing');

for (const glb of ['ambulance.glb', 'firetruck.glb', 'garbage-truck.glb', 'suv-luxury.glb']) {
  if (!existsSync(join(root, 'drive-world/public/models/kenney', glb))) errors.push(`missing kenney/${glb}`);
}

if (errors.length) {
  console.error('check-kenney-service-unlocks failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('check-kenney-service-unlocks ok');