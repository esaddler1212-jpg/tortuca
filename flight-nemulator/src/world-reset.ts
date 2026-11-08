import { Entity, type AppBase } from 'playcanvas';
import { buildMetropolis, getDestructibles, spawnSimpleCars } from './build-city';
import { placeKenneyLandmarks } from './build-city-kenney';
import { placeWorldGachaTowns } from './build-city-worldgacha';
import { buildPlanetShell, initEarthDistrictRing } from './earth-planet';
import { resetChronoAfterWorldShatter } from './earth-orbit';
import { smashDestructible } from './destruction';
import type { QualityTier } from './quality-tier';
import { createWanted, type WantedState } from './wanted';
import type { EnemyDrone } from './combat';

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

/** Chrono armed: wipe the disk and rebuild a fresh Earth. */
export function shatterAndRebuildEarth(
  app: AppBase,
  root: Entity,
  tier: QualityTier,
  drones: EnemyDrone[]
): ShatterResult {
  for (const d of drones) {
    root.removeChild(d.entity);
    d.entity.destroy();
  }
  drones.length = 0;

  obliterateAllCities(app, root, tier);
  clearWorldChildren(root, ['hero']);

  initEarthDistrictRing();
  buildMetropolis(app, root, { tier });
  buildPlanetShell(app, root);
  void placeKenneyLandmarks(app, root, tier === 'low' ? 6 : tier === 'high' ? 22 : 12);
  void placeWorldGachaTowns(app, root, tier === 'low' ? 0 : tier === 'high' ? 3 : 1);
  spawnSimpleCars(app, root, tier === 'low' ? 28 : tier === 'high' ? 120 : 70);

  bumpWorldGeneration();
  resetChronoAfterWorldShatter();

  return { costUsd: 2_500_000_000, generation: worldGeneration() };
}

export function freshWantedAfterShatter(): WantedState {
  return createWanted();
}
