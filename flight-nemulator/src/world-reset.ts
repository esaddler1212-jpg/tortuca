import { Entity, type AppBase } from 'playcanvas';
import { buildMetropolis, getDestructibles, spawnSimpleCars } from './build-city';
import { placeKenneyLandmarks } from './build-city-kenney';
import { placeWorldGachaTowns } from './build-city-worldgacha';
import { buildPlanetShell, initEarthDistrictRing } from './earth-planet';
import { resetChronoAfterWorldShatter } from './earth-orbit';
import { smashDestructible } from './destruction';
import type { QualityTier } from './quality-tier';
import { createWanted, type WantedState } from './wanted';
import type { FactionNpc } from './faction-npcs';
import { installMonuments } from './build-monuments';
import {
  applyThemedSky,
  applyVillainThemeTint,
  restoreDistrictAccents,
  rulerThemeFromHero
} from './world-theme';
import type { HeroForm, HeroSpec } from './hero-roster';
import { saveVillainTheme, clearVillainTheme, type HeroMonument, type VillainWorldTheme } from './world-persist';
import type { WorldFateState } from './world-fate';

const WORLD_GEN_KEY = 'flight-nemulator-world-generation';

export function worldGeneration(): number {
  const raw = localStorage.getItem(WORLD_GEN_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

function bumpWorldGeneration(): void {
  localStorage.setItem(WORLD_GEN_KEY, String(worldGeneration() + 1));
}

function clearWorldChildren(root: Entity, keepNames: string[]): void {
  const keep = new Set(keepNames);
  for (const child of [...root.children]) {
    if (keep.has(child.name)) continue;
    root.removeChild(child);
    child.destroy();
  }
}

export function obliterateAllCities(app: AppBase, root: Entity, tier: QualityTier): number {
  let cost = 0;
  for (const tag of getDestructibles()) {
    if (!tag.intact || tag.immune) continue;
    const p = tag.entity.getPosition();
    const res = smashDestructible(app, root, tag, tier, p);
    if (res) cost += res.costUsd;
  }
  return cost;
}

export type ShatterResult = {
  costUsd: number;
  generation: number;
};

function clearNpcs(npcs: FactionNpc[], root: Entity): void {
  for (const d of npcs) {
    root.removeChild(d.entity);
    d.entity.destroy();
  }
  npcs.length = 0;
}

function assembleFreshEarth(app: AppBase, root: Entity, tier: QualityTier): void {
  initEarthDistrictRing();
  buildMetropolis(app, root, { tier });
  buildPlanetShell(app, root);
  void placeKenneyLandmarks(app, root, tier === 'low' ? 6 : tier === 'high' ? 22 : 12);
  void placeWorldGachaTowns(app, root, tier === 'low' ? 0 : tier === 'high' ? 3 : 1);
  spawnSimpleCars(app, root, tier === 'low' ? 28 : tier === 'high' ? 120 : 70);
}

/** Chrono armed: wipe the disk and rebuild a fresh Earth. */
export function shatterAndRebuildEarth(
  app: AppBase,
  root: Entity,
  tier: QualityTier,
  npcs: FactionNpc[],
  resetTheme = true
): ShatterResult {
  clearNpcs(npcs, root);
  obliterateAllCities(app, root, tier);
  clearWorldChildren(root, ['hero']);
  if (resetTheme) {
    clearVillainTheme();
    restoreDistrictAccents();
  }
  assembleFreshEarth(app, root, tier);
  bumpWorldGeneration();
  resetChronoAfterWorldShatter();
  return { costUsd: 2_500_000_000, generation: worldGeneration() };
}

export function villainRemakeEarthInYourImage(
  app: AppBase,
  root: Entity,
  tier: QualityTier,
  npcs: FactionNpc[],
  hero: HeroSpec,
  form: HeroForm
): ShatterResult {
  const theme = rulerThemeFromHero(hero, form);
  clearNpcs(npcs, root);
  obliterateAllCities(app, root, tier);
  clearWorldChildren(root, ['hero']);
  applyVillainThemeTint(theme.color, 0.72);
  assembleFreshEarth(app, root, tier);
  applyThemedSky(app, theme.color);
  installMonuments(app, root, { codename: theme.label, color: theme.color, scope: 'all' });
  bumpWorldGeneration();
  saveVillainTheme({
    rulerId: hero.id,
    rulerName: theme.label,
    color: theme.color,
    generation: worldGeneration()
  });
  resetChronoAfterWorldShatter();
  return { costUsd: 3_000_000_000, generation: worldGeneration() };
}

export function applyPersistedWorldDecor(
  app: AppBase,
  root: Entity,
  theme: VillainWorldTheme | null,
  monument: HeroMonument | null
): void {
  if (theme) {
    applyVillainThemeTint(theme.color, 0.72);
    applyThemedSky(app, theme.color);
    installMonuments(app, root, { codename: theme.rulerName, color: theme.color, scope: 'all' });
  } else if (monument) {
    installMonuments(app, root, {
      codename: monument.codename,
      color: monument.color,
      scope: monument.districtId
    });
  }
}

export function resetFateAfterAutoRoam(fate: WorldFateState): void {
  fate.phase = 'normal';
  fate.dyingRoamEndMs = null;
  fate.fatePrompt = false;
}

export function freshWantedAfterShatter(): WantedState {
  return createWanted();
}

/** Villain-only: global wipe after enough havoc (no chrono required). */
export function villainAnnihilatePlanet(
  app: AppBase,
  root: Entity,
  tier: QualityTier,
  npcs: FactionNpc[]
): ShatterResult {
  const result = shatterAndRebuildEarth(app, root, tier, npcs, true);
  result.costUsd = 5_000_000_000;
  return result;
}
