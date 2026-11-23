#!/usr/bin/env node
/** Art slice gates: district kits + aligned physics ground (no runtime). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const ground = readFileSync(join(root, 'drive-world/src/build-bay-ground.ts'), 'utf8');
const vallejo = readFileSync(join(root, 'drive-world/src/build-vallejo-estate-kit.ts'), 'utf8');
const ferry = readFileSync(join(root, 'drive-world/src/build-sf-ferry-kit.ts'), 'utf8');
const districts = readFileSync(join(root, 'drive-world/src/build-kenney-districts.ts'), 'utf8');
const recover = readFileSync(join(root, 'drive-world/src/vehicle-recover.ts'), 'utf8');

const errors: string[] = [];
if (!/ground\.setPosition\(0,\s*0\.02/.test(ground)) {
  errors.push('build-bay-ground: physics slab should be raised (setPosition y ≈ 0.02)');
}
if (!vallejo.includes('vallejo-estate-driveway')) errors.push('build-vallejo-estate-kit: driveway missing');
if (!ferry.includes('sf-ferry-plaza')) errors.push('build-sf-ferry-kit: plaza missing');
if (!ferry.includes('sf-ferry-clock-tower')) errors.push('build-sf-ferry-kit: clock tower missing');
if (!districts.includes('placeSfFerryKenneyProps')) errors.push('build-kenney-districts: SF Kenney slots missing');
if (!recover.includes('countWheelsOnGround')) errors.push('vehicle-recover: wheel contact helper missing');

if (errors.length) {
  console.error('check-vallejo-art failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('check-vallejo-art ok (Vallejo + SF ferry art slices)');