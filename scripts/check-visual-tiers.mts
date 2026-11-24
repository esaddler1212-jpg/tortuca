#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const errors: string[] = [];

const mustHave = [
  'drive-world/src/deck-pbr.ts',
  'drive-world/src/build-kenney-props.ts',
  'docs/VISUAL_UPGRADE_TIERS.md'
];

for (const rel of mustHave) {
  if (!existsSync(join(root, rel))) errors.push(`missing ${rel}`);
}

const props = readFileSync(join(root, 'drive-world/src/build-kenney-props.ts'), 'utf8');
if (!props.includes('kenney-modular')) errors.push('build-kenney-props: modular pack missing');
if (!props.includes('placeKenneyPackSlots')) errors.push('build-kenney-props: pack slots missing');

const districts = readFileSync(join(root, 'drive-world/src/build-kenney-districts.ts'), 'utf8');
if (!districts.includes('placeDistrictModularProps')) errors.push('kenney districts: modular props missing');

const main = readFileSync(join(root, 'drive-world/src/main.ts'), 'utf8');
if (!main.includes('preloadDeckPbr')) errors.push('main: deck PBR preload missing');
if (!main.includes('placeFreewayKenneyProps')) errors.push('main: freeway kenney missing');
if (!main.includes('placeFreewayRoadProps')) errors.push('main: freeway roads missing');
if (!main.includes('placeOsmLandmarkMarkers')) errors.push('main: osm landmarks missing');
if (!main.includes('applyCityNightsSky')) errors.push('main: city nights sky missing');

const bayMap = readFileSync(join(root, 'drive-world/src/hud/BayMap.tsx'), 'utf8');
if (!bayMap.includes('minimap-bay-underlay')) errors.push('BayMap: bay underlay missing');

const kenneyBw = readFileSync(join(root, 'flight-nemulator/src/build-city-kenney.ts'), 'utf8');
if (!kenneyBw.includes('placeDistrictKenneyModular')) errors.push('battleworld: modular skyline missing');

const install = readFileSync(join(root, 'tools/gamedev-resources/install-free-packs.sh'), 'utf8');
if (!install.includes('--pbr-decks')) errors.push('install script: pbr-decks missing');
if (!install.includes('--city-glb-full')) errors.push('install script: city-glb-full missing');
if (!install.includes('--nature-glb')) errors.push('install script: nature-glb missing');
if (!install.includes('--roads-glb')) errors.push('install script: roads-glb missing');
if (!install.includes('--building-pbr')) errors.push('install script: building-pbr missing');
if (!existsSync(join(root, 'drive-world/src/geo-anchor.ts'))) errors.push('geo-anchor missing');
if (!existsSync(join(root, 'drive-world/src/vice86-density.ts'))) errors.push('vice86-density missing');
if (!existsSync(join(root, 'docs/COUCH_PASS_VISUAL.md'))) errors.push('COUCH_PASS_VISUAL missing');
const kenneyCars = join(root, 'drive-world/public/models/kenney/ambulance.glb');
if (!existsSync(kenneyCars)) errors.push('full kenney car kit missing');
const heroMini = join(root, 'flight-nemulator/public/models/heroes/emerald-pilot.glb');
if (!existsSync(heroMini)) errors.push('kenney hero glb missing');

if (errors.length) {
  console.error('check-visual-tiers failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('check-visual-tiers ok (Tier 1–6 hooks)');