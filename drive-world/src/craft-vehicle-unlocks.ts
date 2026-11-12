import { CRAFT_VEHICLE_IDS } from './vehicle-catalog';
import type { SavedProgress } from './game-progress';
import { unlockVehicle } from './game-progress';

/** Craft Anything–inspired originals — token unlock (no third-party meshes). */
export const CRAFT_COLLECTIBLE_UNLOCK: Record<string, (typeof CRAFT_VEHICLE_IDS)[number]> = {
  'craft-wedge-shard': 'craft-bay-wedge',
  'craft-lift-shard': 'craft-night-lift',
  'craft-spike-shard': 'craft-street-spike'
};

export function tryUnlockCraftVehicles(progress: SavedProgress): {
  progress: SavedProgress;
  newlyUnlocked: string[];
} {
  const newly: string[] = [];
  let p = progress;
  for (const [collectibleId, vehicleId] of Object.entries(CRAFT_COLLECTIBLE_UNLOCK)) {
    if (!p.collectedIds.includes(collectibleId)) continue;
    if (p.unlockedVehicleIds.includes(vehicleId)) continue;
    p = unlockVehicle(p, vehicleId);
    newly.push(vehicleId);
  }
  return { progress: p, newlyUnlocked: newly };
}
