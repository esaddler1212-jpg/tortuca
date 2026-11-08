import { BONUS_CULTURE_IDS } from './vehicle-catalog';
import type { SavedProgress } from './game-progress';
import { unlockVehicle } from './game-progress';

/** Collectible id → culture homage vehicle (not affiliated; fan tribute). */
export const CULTURE_COLLECTIBLE_UNLOCK: Record<string, (typeof BONUS_CULTURE_IDS)[number]> = {
  'flux-trail': 'legend-time-warp',
  'hyphy-whistle': 'legend-hyphy-shortbus',
  'cookie-case': 'legend-cookie-bus',
  'willie-glove': 'legend-say-hey-cadillac',
  'beast-bell': 'legend-beast-cart'
};

export function tryUnlockCultureVehicles(progress: SavedProgress): SavedProgress {
  let p = progress;
  for (const [collectibleId, vehicleId] of Object.entries(CULTURE_COLLECTIBLE_UNLOCK)) {
    if (!p.collectedIds.includes(collectibleId)) continue;
    if (p.unlockedVehicleIds.includes(vehicleId)) continue;
    p = unlockVehicle(p, vehicleId);
  }
  return p;
}
