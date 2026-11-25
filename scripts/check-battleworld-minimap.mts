/** bw-d09 — minimap home H + arc objective chip. */
const mem = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, v);
  },
  removeItem: (k: string) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  length: 0
};

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  arcMinimapPin,
  arcObjectiveChip,
  homeMinimapPin
} from '../flight-nemulator/src/battleworld-minimap-pins.ts';
import { getHero } from '../flight-nemulator/src/hero-roster.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed = true;
};

const solar = getHero('solar-apex');
const home = homeMinimapPin(solar?.districtId ?? 'sunstone-metro');
ok('home pin labeled H', home.label === 'H' && Number.isFinite(home.x));

const arc = arcMinimapPin('solar-apex', 'hero');
ok('solar arc pin before home-mark', arc != null && arc.x !== 0);

const chip = arcObjectiveChip('Solar Apex: press H at home turf', '1✓ · 2○ · 3○', 'T··S○', true);
ok('arc objective chip combines cues', chip?.includes('Home H on minimap') === true);

const minimapSrc = fs.readFileSync(
  path.join(root, 'flight-nemulator/src/hud/Minimap.tsx'),
  'utf8'
);
ok('minimap home svg class', minimapSrc.includes('minimap-home-h'));
ok('minimap find-next pin', minimapSrc.includes('minimap-find-next'));

if (failed) process.exitCode = 1;
else console.log('check-battleworld-minimap: ok');