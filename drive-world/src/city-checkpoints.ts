import { landmarksInDistrict } from './landmark-registry';
import { TACO_TRUCKS, type TacoTruckDef } from './city-taco-trucks';
import type { SavedProgress } from './game-progress';
import type { DistrictId } from './world-config';

export function districtHasLandmarkVisit(progress: SavedProgress, district: DistrictId): boolean {
  const set = new Set(progress.visitedLandmarkIds);
  return landmarksInDistrict(district).some((lm) => set.has(lm.id));
}

export function districtTacoFound(progress: SavedProgress, district: DistrictId): boolean {
  return progress.tacoTrucksFound.includes(district);
}

/** Taco truck + at least one landmark in the region. */
export function isDistrictCheckpointSatisfied(progress: SavedProgress, district: DistrictId): boolean {
  return districtTacoFound(progress, district) && districtHasLandmarkVisit(progress, district);
}

export function nearestTacoTruck(x: number, z: number): (TacoTruckDef & { dist: number }) | null {
  let best: (TacoTruckDef & { dist: number }) | null = null;
  for (const t of TACO_TRUCKS) {
    const dist = Math.hypot(x - t.x, z - t.z);
    if (dist > t.radius) continue;
    if (!best || dist < best.dist) best = { ...t, dist };
  }
  return best;
}
