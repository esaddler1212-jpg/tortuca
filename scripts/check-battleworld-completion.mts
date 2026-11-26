/**
 * Battleworld "complete" gate — family shippable (not live MP).
 * Env: BATTLEWORLD_COMPLETE_GATE=1 in test:flight-nemulator.
 */
const mem = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, v);
  },
  removeItem: (k: string) => mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
};

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUNDLED_HERO_GLB_IDS } from '../flight-nemulator/src/hero-gltf-paths.ts';
import { BUNDLED_VILLAIN_GLB_IDS } from '../flight-nemulator/src/villain-gltf-paths.ts';
import {
  BATTLEWORLD_CHAPTER_CAMPAIGN,
  battleworldCampaignChapterObjective,
  syncBattleworldChapterCampaign,
} from '../flight-nemulator/src/battleworld-chapters.ts';

const root = join(import.meta.dirname, '..');
const fn = join(root, 'flight-nemulator');

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed = true;
};

ok('campaign has 6 chapters', BATTLEWORLD_CHAPTER_CAMPAIGN.length === 6);

for (const id of BUNDLED_HERO_GLB_IDS) {
  ok(`hero glb ${id}`, existsSync(join(fn, 'public/models/heroes', `${id}.glb`)));
}

for (const id of BUNDLED_VILLAIN_GLB_IDS) {
  ok(`villain glb ${id}`, existsSync(join(fn, 'public/models/villains', `${id}.glb`)));
}

const manifest = JSON.parse(readFileSync(join(fn, 'public/manifest-updates.json'), 'utf8')) as {
  version: number;
};
ok('manifest v3+', manifest.version >= 3);

const hero = 'completion-check-' + Date.now();
const intro = syncBattleworldChapterCampaign(hero, 'hero', false);
ok('campaign sync ch1', intro[0]?.done === true);
const obj = battleworldCampaignChapterObjective(hero, 'hero', false);
ok('campaign objective', obj.includes('Ch.'));

const shipped = readFileSync(join(root, 'docs/BATTLEWORLD_COMPLETE.md'), 'utf8');
ok('BATTLEWORLD_COMPLETE doc', shipped.includes('BATTLEWORLD_COMPLETE_GATE'));

if (failed) process.exitCode = 1;
else console.log('check-battleworld-completion: ok');