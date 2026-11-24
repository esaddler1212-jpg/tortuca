#!/usr/bin/env node
/** Art slice gates: district kits + aligned physics ground (no runtime). */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const ground = readFileSync(join(root, 'drive-world/src/build-bay-ground.ts'), 'utf8');
const vallejo = readFileSync(join(root, 'drive-world/src/build-vallejo-estate-kit.ts'), 'utf8');
const ferry = readFileSync(join(root, 'drive-world/src/build-sf-ferry-kit.ts'), 'utf8');
const marin = readFileSync(join(root, 'drive-world/src/build-marin-bridge-kit.ts'), 'utf8');
const eastbay = readFileSync(join(root, 'drive-world/src/build-eastbay-lake-kit.ts'), 'utf8');
const peninsula = readFileSync(join(root, 'drive-world/src/build-peninsula-sfo-kit.ts'), 'utf8');
const southbay = readFileSync(join(root, 'drive-world/src/build-southbay-sap-kit.ts'), 'utf8');
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
if (!marin.includes('marin-gg-vista-deck')) errors.push('build-marin-bridge-kit: vista deck missing');
if (!districts.includes('placeMarinBridgeKenneyProps')) errors.push('build-kenney-districts: Marin Kenney slots missing');
if (!eastbay.includes('eastbay-lake-promenade')) errors.push('build-eastbay-lake-kit: promenade missing');
if (!districts.includes('placeEastbayLakeKenneyProps')) errors.push('build-kenney-districts: East Bay Kenney slots missing');
if (!peninsula.includes('peninsula-sfo-lot-deck')) errors.push('build-peninsula-sfo-kit: lot deck missing');
if (!districts.includes('placePeninsulaSfoKenneyProps')) errors.push('build-kenney-districts: Peninsula Kenney slots missing');
if (!southbay.includes('southbay-sap-plaza')) errors.push('build-southbay-sap-kit: plaza missing');
if (!districts.includes('placeSouthbaySapKenneyProps')) errors.push('build-kenney-districts: South Bay Kenney slots missing');
if (!recover.includes('countWheelsOnGround')) errors.push('vehicle-recover: wheel contact helper missing');

if (errors.length) {
  console.error('check-vallejo-art failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
const manifest = spawnSync('npx', ['tsx', join(root, 'scripts/check-art-district-manifest.mts')], {
  cwd: root,
  stdio: 'inherit'
});
if (manifest.status !== 0) process.exit(manifest.status ?? 1);

console.log('check-vallejo-art ok (6 Bay region art slices)');