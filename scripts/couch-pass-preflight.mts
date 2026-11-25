#!/usr/bin/env node
/**
 * Machine checks before COUCH_PASS_VISUAL.md on a TV — does not replace human couch QA.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const drive = join(root, 'drive-world/public/models');
const flight = join(root, 'flight-nemulator/public/models');
const warns: string[] = [];
const ok: string[] = [];

const optionalDirs = [
  { label: 'Kenney city (6 anchors)', path: join(drive, 'kenney-city/index.json') },
  { label: 'Kenney modular', path: join(flight, 'kenney-modular/index.json') },
  { label: 'Nature props', path: join(drive, 'kenney-nature/index.json') },
  { label: 'Road props', path: join(drive, 'kenney-roads/index.json') },
  { label: 'Suburban props', path: join(drive, 'kenney-suburban/index.json') },
  { label: 'Deck PBR', path: join(root, 'drive-world/public/textures/ambientcg/deck-asphalt.jpg') },
  { label: 'Building PBR', path: join(root, 'drive-world/public/textures/ambientcg/building-facade.jpg') }
];

for (const row of optionalDirs) {
  if (existsSync(row.path)) ok.push(row.label);
  else warns.push(`${row.label} missing — run install-free-packs.sh`);
}

const wg = join(flight, 'worldgacha/index.json');
if (existsSync(wg) && readFileSync(wg, 'utf8').includes('bay-modular-center')) {
  ok.push('World Gacha skyline (CC0 modular fallback)');
} else {
  warns.push('World Gacha index empty');
}

const required = [
  join(drive, 'kenney/ambulance.glb'),
  join(flight, 'heroes/emerald-pilot.glb'),
  join(flight, 'heroes/jade-architect.glb')
];
for (const p of required) {
  if (!existsSync(p)) {
    console.error(`couch-pass-preflight failed: missing committed asset ${p}`);
    process.exit(1);
  }
}

console.log('couch-pass-preflight ok (committed assets)');
for (const line of ok) console.log(`  ✓ ${line}`);
for (const line of warns) console.warn(`  ⚠ ${line}`);
if (warns.length) {
  console.warn('\nInstall: bash tools/gamedev-resources/install-free-packs.sh --all --city-glb-full --pbr-decks --nature-glb --roads-glb --suburban-glb --building-pbr');
}