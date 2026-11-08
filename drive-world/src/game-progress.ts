import { GARAGE_STARTER_IDS, VEHICLE_CATALOG, REGION_VEHICLE_IDS } from './vehicle-catalog';
import { isDistrictComplete, regionUnlockVehicleId, LANDMARKS } from './landmark-registry';
import type { DistrictId } from './world-config';

export type GamePhase = 'waymo_ride' | 'pick_car' | 'home';

export type SavedProgress = {
  version: 2;
  phase: GamePhase;
  activeVehicleId: string | null;
  unlockedVehicleIds: string[];
  visitedLandmarkIds: string[];
  unlockedRegionIds: DistrictId[];
  safehouseReached: boolean;
};

const STORAGE_KEY = 'drive-world-progress-v2';

function defaultProgress(): SavedProgress {
  return {
    version: 2,
    phase: 'waymo_ride',
    activeVehicleId: null,
    unlockedVehicleIds: [],
    visitedLandmarkIds: [],
    unlockedRegionIds: [],
    safehouseReached: false
  };
}

function migrateRaw(parsed: Record<string, unknown>): SavedProgress | null {
  if (parsed.version === 2) return parsed as SavedProgress;
  return null;
}

export function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const migrated = migrateRaw(parsed);
    if (migrated) return migrated;
    return defaultProgress();
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(progress: SavedProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetProgress(): SavedProgress {
  const fresh = defaultProgress();
  saveProgress(fresh);
  return fresh;
}

export function finishWaymoRide(progress: SavedProgress): SavedProgress {
  const next: SavedProgress = {
    ...progress,
    phase: 'pick_car',
    safehouseReached: true
  };
  saveProgress(next);
  return next;
}

export function chooseGarageCar(progress: SavedProgress, vehicleId: string): SavedProgress {
  if (!GARAGE_STARTER_IDS.includes(vehicleId as (typeof GARAGE_STARTER_IDS)[number])) {
    throw new Error('Not a garage starter vehicle');
  }
  const next: SavedProgress = {
    ...progress,
    phase: 'home',
    activeVehicleId: vehicleId,
    unlockedVehicleIds: progress.unlockedVehicleIds.includes(vehicleId)
      ? progress.unlockedVehicleIds
      : [vehicleId, ...progress.unlockedVehicleIds]
  };
  saveProgress(next);
  return next;
}

export function unlockVehicle(progress: SavedProgress, vehicleId: string): SavedProgress {
  if (!VEHICLE_CATALOG[vehicleId]) return progress;
  if (progress.unlockedVehicleIds.includes(vehicleId)) return progress;
  const next = {
    ...progress,
    unlockedVehicleIds: [...progress.unlockedVehicleIds, vehicleId]
  };
  saveProgress(next);
  return next;
}

export function visitLandmark(progress: SavedProgress, landmarkId: string): SavedProgress {
  if (progress.visitedLandmarkIds.includes(landmarkId)) return progress;
  const next: SavedProgress = {
    ...progress,
    visitedLandmarkIds: [...progress.visitedLandmarkIds, landmarkId]
  };
  saveProgress(next);
  return next;
}

export function tryUnlockCompletedRegions(progress: SavedProgress): {
  progress: SavedProgress;
  newlyUnlocked: { district: DistrictId; vehicleId: string }[];
} {
  const newlyUnlocked: { district: DistrictId; vehicleId: string }[] = [];
  let current = progress;
  const districts = Object.keys(REGION_VEHICLE_IDS) as DistrictId[];

  for (const district of districts) {
    if (current.unlockedRegionIds.includes(district)) continue;
    if (!isDistrictComplete(current.visitedLandmarkIds, district)) continue;
    const vehicleId = regionUnlockVehicleId(district);
    current = {
      ...current,
      unlockedRegionIds: [...current.unlockedRegionIds, district]
    };
    current = unlockVehicle(current, vehicleId);
    newlyUnlocked.push({ district, vehicleId });
  }

  if (newlyUnlocked.length > 0) saveProgress(current);
  return { progress: current, newlyUnlocked };
}

export function setActiveVehicle(progress: SavedProgress, vehicleId: string): SavedProgress {
  if (!progress.unlockedVehicleIds.includes(vehicleId)) return progress;
  const next = { ...progress, activeVehicleId: vehicleId };
  saveProgress(next);
  return next;
}

export function countRegionsComplete(progress: SavedProgress): number {
  return progress.unlockedRegionIds.length;
}

export const TOTAL_LANDMARKS = LANDMARKS.length;
export const TOTAL_REGIONS = Object.keys(REGION_VEHICLE_IDS).length;
