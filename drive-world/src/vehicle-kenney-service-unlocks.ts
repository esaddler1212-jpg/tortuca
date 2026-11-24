import { LANDMARKS } from './landmark-registry';
import type { SavedProgress } from './game-progress';
import { saveProgress, unlockVehicle } from './game-progress';
import { BONUS_KENNEY_SERVICE_IDS } from './vehicle-catalog';

export type KenneyServiceUnlock = {
  id: (typeof BONUS_KENNEY_SERVICE_IDS)[number];
  label: string;
  hint: string;
  satisfied: (progress: SavedProgress) => boolean;
};

const ALL_BAY_REGIONS = 6;

function fuelFillCount(progress: SavedProgress): number {
  return progress.journal.filter((j) => j.kind === 'fuel').length;
}

export const KENNEY_SERVICE_UNLOCKS: KenneyServiceUnlock[] = [
  {
    id: 'bonus-night-medic',
    label: 'Night Medic',
    hint: 'Free fill at any pump 3× (or Vallejo chapter fuel step)',
    satisfied: (p) =>
      fuelFillCount(p) >= 3 ||
      p.missionStepsCompleted.includes('v-fuel')
  },
  {
    id: 'bonus-fire-watch',
    label: 'Fire Watch',
    hint: 'Unlock every Bay region (map fog)',
    satisfied: (p) => p.unlockedRegionIds.length >= ALL_BAY_REGIONS
  },
  {
    id: 'bonus-route-collect',
    label: 'Route Collector',
    hint: `Visit all ${LANDMARKS.length} landmark beacons`,
    satisfied: (p) => p.visitedLandmarkIds.length >= LANDMARKS.length
  },
  {
    id: 'bonus-peninsula-luxe',
    label: 'Peninsula Luxe',
    hint: 'Peninsula sideshow badge or Sand Low meet car',
    satisfied: (p) =>
      p.meetBadges.includes('meet-peninsula') ||
      p.unlockedVehicleIds.includes('meet-pen-low')
  }
];

export function tryUnlockKenneyServiceVehicles(progress: SavedProgress): {
  progress: SavedProgress;
  newlyUnlocked: string[];
} {
  const newly: string[] = [];
  let p = progress;
  for (const row of KENNEY_SERVICE_UNLOCKS) {
    if (!row.satisfied(p)) continue;
    if (p.unlockedVehicleIds.includes(row.id)) continue;
    p = unlockVehicle(p, row.id);
    newly.push(row.id);
  }
  if (newly.length) saveProgress(p);
  return { progress: p, newlyUnlocked: newly };
}