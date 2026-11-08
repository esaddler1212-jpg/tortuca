import {
  AUTOPILOT_VEHICLE_ID,
  BONUS_AERIAL_IDS,
  BONUS_LEGEND_IDS,
  GARAGE_STARTER_IDS,
  VEHICLE_CATALOG,
  REGION_VEHICLE_IDS
} from './vehicle-catalog';
import { defaultHomeSafehouseId, ensureSafehouseUnlocks } from './safehouse-registry';
import { tryUnlockCultureVehicles } from './bay-culture-unlocks';
import { SCENIC_ROUTES } from './world-extras';
import { isDistrictCheckpointSatisfied } from './city-checkpoints';
import { regionUnlockVehicleId, LANDMARKS } from './landmark-registry';
import type { DistrictId } from './world-config';
import {
  DEFAULT_CUSTOMIZATION,
  defaultCustomizationFor,
  mergeCustomization,
  type VehicleCustomization
} from './vehicle-customization';
import { seedGhostTapes } from './cpm-ghost';
import { tryUnlockCraftVehicles } from './craft-vehicle-unlocks';
import { migrateRenamedVehicles } from './save-vehicle-migrations';

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

export type JournalEntry = {
  t: number;
  kind: 'landmark' | 'vista' | 'scenic' | 'taco' | 'parking' | 'fuel' | 'taxi' | 'cpm';
  id: string;
  label: string;
};

export type CustomSafehouse = {
  id: string;
  name: string;
  x: number;
  z: number;
  district: DistrictId;
  createdAt: number;
};

export type CpmGhostTape = {
  kind: 'drag' | 'time';
  id: string;
  valueMs: number;
  splits: number[];
};

export type SavedProgress = {
  version: 9;
  phase: GamePhase;
  activeVehicleId: string | null;
  unlockedVehicleIds: string[];
  visitedLandmarkIds: string[];
  tacoTrucksFound: DistrictId[];
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
  /** Highest heat level reached (unlock tracking) */
  heatPeakEver: number;
  visitedVistaIds: string[];
  journal: JournalEntry[];
  homeSafehouseId: string;
  unlockedSafehouseIds: string[];
  customSafehouses: CustomSafehouse[];
  /** 0–1 tank for optional fuel sim */
  fuelLevel: number;
  /** Best star count per landmark parking spot id */
  parkingStars: Record<string, number>;
  /** CPM chapter checklist (Vallejo first mission) */
  missionStepsCompleted: string[];
  cpmDriftBests: Record<string, number>;
  cpmTimeAttackMs: Record<string, number>;
  cpmDragBestET: number | null;
  /** Personal-best ghost tapes for drag/time rivalry HUD */
  cpmGhostTapes: Record<string, CpmGhostTape>;
  landmarkSprintMs: Record<string, number>;
  taxiCompletedIds: string[];
  dynoRunCount: number;
  meetBadges: string[];
  activeTaxiId: string | null;
};

const STORAGE_KEY = 'drive-world-progress-v5';

function defaultProgress(): SavedProgress {
  return {
    version: 9,
    phase: 'waymo_ride',
    activeVehicleId: null,
    unlockedVehicleIds: [],
    visitedLandmarkIds: [],
    tacoTrucksFound: [],
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
    heatPeakEver: 0,
    visitedVistaIds: [],
    journal: [],
    homeSafehouseId: defaultHomeSafehouseId(),
    unlockedSafehouseIds: [defaultHomeSafehouseId()],
    customSafehouses: [],
    fuelLevel: 1,
    parkingStars: {},
    missionStepsCompleted: [],
    cpmDriftBests: {},
    cpmTimeAttackMs: {},
    cpmDragBestET: null,
    cpmGhostTapes: {},
    landmarkSprintMs: {},
    taxiCompletedIds: [],
    dynoRunCount: 0,
    meetBadges: [],
    activeTaxiId: null
  };
}

function withV9Defaults(p: Partial<Omit<SavedProgress, 'version'>> & { version: number }): SavedProgress {
  const base: SavedProgress = {
    ...defaultProgress(),
    ...p,
    version: 9,
    tacoTrucksFound: p.tacoTrucksFound ?? [],
    collectedIds: p.collectedIds ?? [],
    unlockedPaintIds:
      p.unlockedPaintIds ?? ['bay-blue', 'fog-white', 'bridge-orange', 'neon-cyan', 'cherry-red', 'stealth'],
    speedTrapBests: p.speedTrapBests ?? {},
    scenicCompleted: p.scenicCompleted ?? [],
    scenicProgress: p.scenicProgress ?? {},
    vehicleStats: p.vehicleStats ?? {},
    heatLevel: typeof p.heatLevel === 'number' ? p.heatLevel : 0,
    heatPeakEver: typeof p.heatPeakEver === 'number' ? p.heatPeakEver : 0,
    visitedVistaIds: p.visitedVistaIds ?? [],
    journal: p.journal ?? [],
    homeSafehouseId: p.homeSafehouseId ?? defaultHomeSafehouseId(),
    unlockedSafehouseIds: p.unlockedSafehouseIds ?? [defaultHomeSafehouseId()],
    customSafehouses: p.customSafehouses ?? [],
    fuelLevel: typeof p.fuelLevel === 'number' ? Math.max(0, Math.min(1, p.fuelLevel)) : 1,
    parkingStars: p.parkingStars ?? {},
    missionStepsCompleted: p.missionStepsCompleted ?? [],
    cpmDriftBests: p.cpmDriftBests ?? {},
    cpmTimeAttackMs: p.cpmTimeAttackMs ?? {},
    cpmDragBestET: p.cpmDragBestET ?? null,
    cpmGhostTapes: p.cpmGhostTapes ?? {},
    landmarkSprintMs: p.landmarkSprintMs ?? {},
    taxiCompletedIds: p.taxiCompletedIds ?? [],
    dynoRunCount: p.dynoRunCount ?? 0,
    meetBadges: p.meetBadges ?? [],
    activeTaxiId: p.activeTaxiId ?? null,
    cameraMode: normalizeCameraMode(p.cameraMode)
  };
  return migrateRenamedVehicles(base);
}

function migrateRaw(parsed: Record<string, unknown>): SavedProgress | null {
  if (parsed.version === 9) return withV9Defaults(parsed as SavedProgress);
  if (parsed.version === 8) return withV9Defaults(parsed as SavedProgress & { version: 8 });
  if (parsed.version === 7) return withV9Defaults(parsed as SavedProgress & { version: 7 });
  if (parsed.version === 6) return withV9Defaults(parsed as SavedProgress & { version: 6 });
  if (parsed.version === 5) return withV9Defaults(parsed as SavedProgress & { version: 5 });
  if (parsed.version === 4) return withV9Defaults(parsed as SavedProgress & { version: 4 });
  if (parsed.version === 3) {
    const p = parsed as unknown as Omit<SavedProgress, 'version'>;
    return withV9Defaults({ ...p, version: 3, lastPose: null, cameraMode: 'chase' });
  }
  if (parsed.version === 2) {
    const p = parsed as unknown as Omit<SavedProgress, 'version' | 'customizations'> & {
      version: 2;
      customizations?: Record<string, VehicleCustomization>;
    };
    const { version: _v, ...rest } = p;
    return withV9Defaults({
      ...rest,
      version: 2,
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
    if (migrated) return seedGhostTapes(migrated);
    return defaultProgress();
  } catch {
    return defaultProgress();
  }
}

export function recordDynoRun(progress: SavedProgress): SavedProgress {
  return { ...progress, dynoRunCount: progress.dynoRunCount + 1 };
}

export function startTaxiContract(progress: SavedProgress, contractId: string): SavedProgress {
  return { ...progress, activeTaxiId: contractId };
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
    safehouseReached: true,
    unlockedSafehouseIds: progress.unlockedSafehouseIds.includes(defaultHomeSafehouseId())
      ? progress.unlockedSafehouseIds
      : [...progress.unlockedSafehouseIds, defaultHomeSafehouseId()]
  };
  saveProgress(next);
  return ensureSafehouseUnlocks(next);
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

export function findTacoTruck(progress: SavedProgress, district: DistrictId): SavedProgress {
  if (progress.tacoTrucksFound.includes(district)) return progress;
  const next: SavedProgress = {
    ...progress,
    tacoTrucksFound: [...progress.tacoTrucksFound, district]
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
    if (!isDistrictCheckpointSatisfied(current, district)) continue;
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
  const base = saved ? mergeCustomization(saved) : undefined;
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
  next = tryUnlockCultureVehicles(next);
  next = tryUnlockCraftVehicles(next).progress;
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
