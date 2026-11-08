import {
  AUTOPILOT_VEHICLE_ID,
  BONUS_AERIAL_IDS,
  BONUS_LEGEND_IDS,
  GARAGE_STARTER_IDS,
  VEHICLE_CATALOG,
  REGION_VEHICLE_IDS
} from './vehicle-catalog';
import { SCENIC_ROUTES } from './world-extras';
import { isDistrictComplete, regionUnlockVehicleId, LANDMARKS } from './landmark-registry';
import type { DistrictId } from './world-config';
import {
  DEFAULT_CUSTOMIZATION,
  defaultCustomizationFor,
  type VehicleCustomization
} from './vehicle-customization';

export type GamePhase = 'waymo_ride' | 'pick_car' | 'home';

export type SavedPose = { x: number; y: number; z: number; yaw: number };

export type CameraMode =
  | 'chase'
  | 'hood'
  | 'low'
  | 'cinematic'
  | 'cockpit'
  | 'wide'
  | 'drone'
  | 'orbit'
  | 'vista';

const VALID_CAMERAS = new Set<CameraMode>([
  'chase',
  'hood',
  'low',
  'cinematic',
  'cockpit',
  'wide',
  'drone',
  'orbit',
  'vista'
]);

export function normalizeCameraMode(mode: string | undefined): CameraMode {
  if (mode && VALID_CAMERAS.has(mode as CameraMode)) return mode as CameraMode;
  return 'chase';
}

export type VehicleStats = { miles: number; topMph: number };

export type SavedProgress = {
  version: 5;
  phase: GamePhase;
  activeVehicleId: string | null;
  unlockedVehicleIds: string[];
  visitedLandmarkIds: string[];
  unlockedRegionIds: DistrictId[];
  safehouseReached: boolean;
  customizations: Record<string, VehicleCustomization>;
  lastPose: SavedPose | null;
  cameraMode: CameraMode;
  collectedIds: string[];
  unlockedPaintIds: string[];
  speedTrapBests: Record<string, number>;
  scenicCompleted: string[];
  scenicProgress: Record<string, number>;
  vehicleStats: Record<string, VehicleStats>;
  /** Speed-trap heat 0–5 */
  heatLevel: number;
  visitedVistaIds: string[];
};

const STORAGE_KEY = 'drive-world-progress-v5';

function defaultProgress(): SavedProgress {
  return {
    version: 5,
    phase: 'waymo_ride',
    activeVehicleId: null,
    unlockedVehicleIds: [],
    visitedLandmarkIds: [],
    unlockedRegionIds: [],
    safehouseReached: false,
    customizations: {},
    lastPose: null,
    cameraMode: 'chase',
    collectedIds: [],
    unlockedPaintIds: ['bay-blue', 'fog-white', 'bridge-orange', 'neon-cyan', 'cherry-red', 'stealth'],
    speedTrapBests: {},
    scenicCompleted: [],
    scenicProgress: {},
    vehicleStats: {},
    heatLevel: 0,
    visitedVistaIds: []
  };
}

function withV5Defaults(p: Partial<SavedProgress> & { version: number }): SavedProgress {
  return {
    ...defaultProgress(),
    ...p,
    version: 5,
    collectedIds: p.collectedIds ?? [],
    unlockedPaintIds:
      p.unlockedPaintIds ?? ['bay-blue', 'fog-white', 'bridge-orange', 'neon-cyan', 'cherry-red', 'stealth'],
    speedTrapBests: p.speedTrapBests ?? {},
    scenicCompleted: p.scenicCompleted ?? [],
    scenicProgress: p.scenicProgress ?? {},
    vehicleStats: p.vehicleStats ?? {},
    heatLevel: typeof p.heatLevel === 'number' ? p.heatLevel : 0,
    visitedVistaIds: p.visitedVistaIds ?? [],
    cameraMode: normalizeCameraMode(p.cameraMode)
  };
}

function migrateRaw(parsed: Record<string, unknown>): SavedProgress | null {
  if (parsed.version === 5) return withV5Defaults(parsed as SavedProgress);
  if (parsed.version === 4) return withV5Defaults(parsed as SavedProgress & { version: 4 });
  if (parsed.version === 3) {
    const p = parsed as SavedProgress & { version: 3 };
    return withV5Defaults({ ...p, lastPose: null, cameraMode: 'chase' });
  }
  if (parsed.version === 2) {
    const p = parsed as SavedProgress & { version: 2; customizations?: Record<string, VehicleCustomization> };
    const { version: _v, ...rest } = p;
    return withV5Defaults({
      ...rest,
      customizations: p.customizations ?? {},
      lastPose: null,
      cameraMode: 'chase'
    });
  }
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

export function visitCruiseVista(progress: SavedProgress, vistaId: string): SavedProgress {
  if (progress.visitedVistaIds.includes(vistaId)) return progress;
  const next: SavedProgress = {
    ...progress,
    visitedVistaIds: [...progress.visitedVistaIds, vistaId]
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

export function saveLastPose(progress: SavedProgress, pose: SavedPose): SavedProgress {
  const next = { ...progress, lastPose: pose };
  saveProgress(next);
  return next;
}

export function setCameraMode(progress: SavedProgress, cameraMode: CameraMode): SavedProgress {
  const next = { ...progress, cameraMode };
  saveProgress(next);
  return next;
}

export function getVehicleCustomization(progress: SavedProgress, vehicleId: string): VehicleCustomization {
  const saved = progress.customizations[vehicleId];
  const base = saved ? { ...DEFAULT_CUSTOMIZATION, ...saved } : undefined;
  if (base) return base;
  const spec = VEHICLE_CATALOG[vehicleId];
  return spec ? defaultCustomizationFor(spec) : { ...DEFAULT_CUSTOMIZATION };
}

export function collectItem(progress: SavedProgress, id: string, paintId: string): SavedProgress {
  if (progress.collectedIds.includes(id)) return progress;
  const paints = progress.unlockedPaintIds.includes(paintId)
    ? progress.unlockedPaintIds
    : [...progress.unlockedPaintIds, paintId];
  let next = {
    ...progress,
    collectedIds: [...progress.collectedIds, id],
    unlockedPaintIds: paints
  };
  next = tryUnlockCoastHeli(next);
  next = tryUnlockLegendVehicles(next);
  next = tryUnlockNightCoil(next);
  saveProgress(next);
  return next;
}

export function tryUnlockNightCoil(progress: SavedProgress): SavedProgress {
  if (progress.unlockedVehicleIds.includes(AUTOPILOT_VEHICLE_ID)) return progress;
  if (!progress.collectedIds.includes('tech-chip')) return progress;
  return unlockVehicle(progress, AUTOPILOT_VEHICLE_ID);
}

export function tryUnlockLegendVehicles(progress: SavedProgress): SavedProgress {
  let p = progress;
  const gotham = BONUS_LEGEND_IDS[0];
  const scarlet = BONUS_LEGEND_IDS[1];
  if (p.collectedIds.includes('cave-key') && !p.unlockedVehicleIds.includes(gotham)) {
    p = unlockVehicle(p, gotham);
  }
  if (p.collectedIds.includes('mach-cog') && !p.unlockedVehicleIds.includes(scarlet)) {
    p = unlockVehicle(p, scarlet);
  }
  return p;
}

export function tryUnlockSkywayHover(progress: SavedProgress): SavedProgress {
  const id = BONUS_AERIAL_IDS[0];
  if (progress.unlockedVehicleIds.includes(id)) return progress;
  if (progress.scenicCompleted.length < SCENIC_ROUTES.length) return progress;
  return unlockVehicle(progress, id);
}

export function tryUnlockCoastHeli(progress: SavedProgress): SavedProgress {
  const id = BONUS_AERIAL_IDS[1];
  if (progress.unlockedVehicleIds.includes(id)) return progress;
  if (!progress.collectedIds.includes('rotor-token')) return progress;
  return unlockVehicle(progress, id);
}

export function recordSpeedTrap(progress: SavedProgress, trapId: string, mph: number): SavedProgress {
  const prev = progress.speedTrapBests[trapId] ?? 0;
  if (mph <= prev) return progress;
  const next = { ...progress, speedTrapBests: { ...progress.speedTrapBests, [trapId]: mph } };
  saveProgress(next);
  return next;
}

export function tickScenicRoute(progress: SavedProgress, routeId: string, checkpointIdx: number): SavedProgress {
  const cur = progress.scenicProgress[routeId] ?? 0;
  if (checkpointIdx !== cur) return progress;
  const nextIdx = cur + 1;
  let next: SavedProgress = {
    ...progress,
    scenicProgress: { ...progress.scenicProgress, [routeId]: nextIdx }
  };
  saveProgress(next);
  return next;
}

export function completeScenicRoute(progress: SavedProgress, routeId: string): SavedProgress {
  if (progress.scenicCompleted.includes(routeId)) return progress;
  const next = { ...progress, scenicCompleted: [...progress.scenicCompleted, routeId] };
  saveProgress(next);
  return next;
}

export function bumpVehicleStats(
  progress: SavedProgress,
  vehicleId: string,
  milesDelta: number,
  mph: number
): SavedProgress {
  const prev = progress.vehicleStats[vehicleId] ?? { miles: 0, topMph: 0 };
  const next = {
    ...progress,
    vehicleStats: {
      ...progress.vehicleStats,
      [vehicleId]: {
        miles: prev.miles + milesDelta,
        topMph: Math.max(prev.topMph, mph)
      }
    }
  };
  saveProgress(next);
  return next;
}

export function setVehicleCustomization(
  progress: SavedProgress,
  vehicleId: string,
  custom: VehicleCustomization
): SavedProgress {
  const next: SavedProgress = {
    ...progress,
    customizations: { ...progress.customizations, [vehicleId]: { ...custom } }
  };
  saveProgress(next);
  return next;
}

export function countRegionsComplete(progress: SavedProgress): number {
  return progress.unlockedRegionIds.length;
}

export const TOTAL_LANDMARKS = LANDMARKS.length;
export const TOTAL_REGIONS = Object.keys(REGION_VEHICLE_IDS).length;
