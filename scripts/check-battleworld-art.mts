#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const css = readFileSync(join(root, 'flight-nemulator/src/hud/hud.css'), 'utf8');
const vfx = readFileSync(join(root, 'flight-nemulator/src/vfx.ts'), 'utf8');
const pins = readFileSync(join(root, 'flight-nemulator/src/battleworld-minimap-pins.ts'), 'utf8');
const kenney = readFileSync(join(root, 'flight-nemulator/src/build-city-kenney.ts'), 'utf8');
const rim = readFileSync(join(root, 'flight-nemulator/src/build-district-rim-lights.ts'), 'utf8');
const loop = readFileSync(join(root, 'flight-nemulator/src/game-loop.ts'), 'utf8');
const hudApp = readFileSync(join(root, 'flight-nemulator/src/hud/HudApp.tsx'), 'utf8');
const heroGlb = join(root, 'flight-nemulator/public/models/heroes/solar-apex.glb');

const errors: string[] = [];
if (!css.includes('.hud-arc-objective')) errors.push('hud.css: .hud-arc-objective missing');
if (!css.includes('-webkit-line-clamp')) errors.push('hud.css: arc chip line clamp missing');
if (!vfx.includes("kind: 'ring'")) errors.push('vfx.ts: crater ring kind missing');
if (!pins.includes('52')) errors.push('arcObjectiveChip: short arc hint length not applied');
if (!existsSync(heroGlb)) errors.push('solar-apex.glb missing under public/models/heroes/');
if (!css.includes('.hero-picker-more')) errors.push('hud.css: hero-picker-more missing');
if (!hudApp.includes('hero-picker-more')) errors.push('HudApp: collapsed arc details missing');
if (!kenney.includes('placeDistrictKenneySkyline')) errors.push('build-city-kenney: district skyline missing');
if (!rim.includes('district-rim-beacon')) errors.push('build-district-rim-lights: beacons missing');
if (!loop.includes('buildDistrictRimLights')) errors.push('game-loop: district rim lights not wired');
if (!kenney.includes('placeDistrictKenneyModular')) errors.push('build-city-kenney: modular district missing');
if (!loop.includes('placeDistrictKenneyModular')) errors.push('game-loop: modular kenney not wired');
if (!hudApp.includes('HudIcon')) errors.push('HudApp: HudIcon missing');
if (!existsSync(join(root, 'flight-nemulator/public/hud/icons/objective.svg'))) errors.push('hud icons missing');
if (!existsSync(join(root, 'flight-nemulator/public/models/heroes/storm-hammer.glb'))) errors.push('storm-hammer kenney glb missing');

if (errors.length) {
  console.error('check-battleworld-art failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('check-battleworld-art ok');