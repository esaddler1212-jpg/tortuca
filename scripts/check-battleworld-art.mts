#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const css = readFileSync(join(root, 'flight-nemulator/src/hud/hud.css'), 'utf8');
const vfx = readFileSync(join(root, 'flight-nemulator/src/vfx.ts'), 'utf8');
const pins = readFileSync(join(root, 'flight-nemulator/src/battleworld-minimap-pins.ts'), 'utf8');
const heroGlb = join(root, 'flight-nemulator/public/models/heroes/solar-apex.glb');

const errors: string[] = [];
if (!css.includes('.hud-arc-objective')) errors.push('hud.css: .hud-arc-objective missing');
if (!css.includes('-webkit-line-clamp')) errors.push('hud.css: arc chip line clamp missing');
if (!vfx.includes("kind: 'ring'")) errors.push('vfx.ts: crater ring kind missing');
if (!pins.includes('52')) errors.push('arcObjectiveChip: short arc hint length not applied');
if (!existsSync(heroGlb)) errors.push('solar-apex.glb missing under public/models/heroes/');

if (errors.length) {
  console.error('check-battleworld-art failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('check-battleworld-art ok');