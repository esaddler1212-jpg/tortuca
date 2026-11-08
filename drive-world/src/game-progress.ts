import { STARTER_VEHICLE_IDS, VEHICLE_CATALOG } from './vehicle-catalog';

export type GamePhase = 'pick_car' | 'to_safehouse' | 'home';

export type SavedProgress = {
  version: 1;
  phase: GamePhase;
  activeVehicleId: string | null;
  unlockedVehicleIds: string[];
  visitedLandmarkIds: string[];
  safehouseReached: boolean;
};

const STORAGE_KEY = 'drive-world-progress-v1';

function defaultProgress(): SavedProgress {
  return {
    version: 1,
    phase: 'pick_car',
    activeVehicleId: null,
    unlockedVehicleIds: [],
    visitedLandmarkIds: [],
    safehouseReached: false
  };
}

export function loadProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as SavedProgress;
    if (parsed.version !== 1) return defaultProgress();
    return parsed;
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

export function chooseStarterCar(progress: SavedProgress, vehicleId: string): SavedProgress {
  if (!STARTER_VEHICLE_IDS.includes(vehicleId as (typeof STARTER_VEHICLE_IDS)[number])) {
    throw new Error('Not a starter vehicle');
  }
  const next: SavedProgress = {
    ...progress,
    phase: 'to_safehouse',
    activeVehicleId: vehicleId,
    unlockedVehicleIds: [vehicleId]
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

export function visitLandmark(progress: SavedProgress, landmarkId: string, unlockVehicleId: string): SavedProgress {
  if (progress.visitedLandmarkIds.includes(landmarkId)) return progress;
  let next: SavedProgress = {
    ...progress,
    visitedLandmarkIds: [...progress.visitedLandmarkIds, landmarkId]
  };
  next = unlockVehicle(next, unlockVehicleId);
  saveProgress(next);
  return next;
}

export function reachSafehouse(progress: SavedProgress): SavedProgress {
  if (progress.safehouseReached && progress.phase === 'home') return progress;
  const next: SavedProgress = {
    ...progress,
    phase: 'home',
    safehouseReached: true
  };
  saveProgress(next);
  return next;
}

export function setActiveVehicle(progress: SavedProgress, vehicleId: string): SavedProgress {
  if (!progress.unlockedVehicleIds.includes(vehicleId)) return progress;
  const next = { ...progress, activeVehicleId: vehicleId };
  saveProgress(next);
  return next;
}
