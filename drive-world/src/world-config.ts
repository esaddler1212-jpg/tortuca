import { Vec3 } from 'playcanvas';

/** +X east, +Z north. Full reference-map coverage (compressed). */
export const WORLD_HALF_M = 2600;

export const FREEWAY_WIDTH_M = 34;
export const STRIPE_SPACING_M = 36;

/** Legacy debug spawn on I-80; game start uses SFO airport in `landmark-registry.ts`. */
export const SPAWN_SF = new Vec3(-760, 2.2, -490);

export type DistrictId = 'sf' | 'eastBay' | 'vallejo' | 'peninsula' | 'southBay' | 'marin';

export type MapRegionId = DistrictId;

export type FreewayWaypoint = { x: number; z: number; y?: number };

export interface DistrictSpec {
  id: DistrictId;
  label: string;
  mapRegion: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  blockM: number;
  heightMin: number;
  heightMax: number;
  footprintMin: number;
  footprintMax: number;
  heightMul: number;
  flat: boolean;
}

export const DISTRICTS: Record<DistrictId, DistrictSpec> = {
  sf: {
    id: 'sf',
    label: 'San Francisco',
    mapRegion: 'San Francisco',
    minX: -1180,
    maxX: -80,
    minZ: -920,
    maxZ: -80,
    blockM: 68,
    heightMin: 14,
    heightMax: 72,
    footprintMin: 12,
    footprintMax: 28,
    heightMul: 1.25,
    flat: false
  },
  marin: {
    id: 'marin',
    label: 'Marin',
    mapRegion: 'North Bay',
    minX: -1280,
    maxX: -420,
    minZ: -120,
    maxZ: 720,
    blockM: 82,
    heightMin: 8,
    heightMax: 32,
    footprintMin: 14,
    footprintMax: 36,
    heightMul: 0.95,
    flat: false
  },
  eastBay: {
    id: 'eastBay',
    label: 'Oakland / East Bay',
    mapRegion: 'East Bay',
    minX: 320,
    maxX: 1180,
    minZ: -520,
    maxZ: 480,
    blockM: 76,
    heightMin: 10,
    heightMax: 40,
    footprintMin: 16,
    footprintMax: 34,
    heightMul: 1,
    flat: false
  },
  vallejo: {
    id: 'vallejo',
    label: 'Vallejo',
    mapRegion: 'North Bay (Solano)',
    minX: 280,
    maxX: 1100,
    minZ: 520,
    maxZ: 1580,
    blockM: 80,
    heightMin: 8,
    heightMax: 26,
    footprintMin: 18,
    footprintMax: 42,
    heightMul: 0.9,
    flat: true
  },
  peninsula: {
    id: 'peninsula',
    label: 'Peninsula',
    mapRegion: 'Peninsula',
    minX: -980,
    maxX: 280,
    minZ: -1980,
    maxZ: -960,
    blockM: 74,
    heightMin: 10,
    heightMax: 36,
    footprintMin: 14,
    footprintMax: 32,
    heightMul: 1,
    flat: false
  },
  southBay: {
    id: 'southBay',
    label: 'South Bay',
    mapRegion: 'South Bay',
    minX: -80,
    maxX: 1180,
    minZ: -1980,
    maxZ: -580,
    blockM: 78,
    heightMin: 10,
    heightMax: 42,
    footprintMin: 16,
    footprintMax: 38,
    heightMul: 1.05,
    flat: false
  }
};

/** I-80: SF → Bay Bridge → Oakland → Vallejo. */
export const FREEWAY_I80: FreewayWaypoint[] = [
  { x: -860, z: -520, y: 0 },
  { x: -680, z: -505, y: 0 },
  { x: -480, z: -488, y: 0 },
  { x: -240, z: -472, y: 1 },
  { x: -20, z: -455, y: 8 },
  { x: 220, z: -438, y: 20 },
  { x: 460, z: -422, y: 26 },
  { x: 680, z: -405, y: 10 },
  { x: 740, z: -320, y: 0 },
  { x: 710, z: -80, y: 0 },
  { x: 680, z: 160, y: 0 },
  { x: 640, z: 420, y: 0 },
  { x: 600, z: 680, y: 0 },
  { x: 560, z: 940, y: 0 }
];

/** US-101: SF → Peninsula → San José. */
export const FREEWAY_101: FreewayWaypoint[] = [
  { x: -820, z: -520, y: 0 },
  { x: -780, z: -720, y: 0 },
  { x: -700, z: -980, y: 0 },
  { x: -580, z: -1220, y: 0 },
  { x: -400, z: -1480, y: 0 },
  { x: -120, z: -1680, y: 0 },
  { x: 220, z: -1780, y: 0 },
  { x: 520, z: -1820, y: 0 }
];

/** I-880: San José → East Bay (east shore). */
export const FREEWAY_880: FreewayWaypoint[] = [
  { x: 580, z: -1810, y: 0 },
  { x: 680, z: -1560, y: 0 },
  { x: 760, z: -1280, y: 0 },
  { x: 800, z: -980, y: 0 },
  { x: 780, z: -700, y: 0 },
  { x: 750, z: -420, y: 0 },
  { x: 740, z: -320, y: 0 }
];

/** I-280: SF ↔ Peninsula interior. */
export const FREEWAY_280: FreewayWaypoint[] = [
  { x: -750, z: -580, y: 0 },
  { x: -680, z: -820, y: 0 },
  { x: -580, z: -1050, y: 0 },
  { x: -420, z: -1280, y: 0 },
  { x: -220, z: -1480, y: 0 },
  { x: 40, z: -1620, y: 0 }
];

/** All drivable freeway spines for the bay loop. */
export const FREEWAY_ROUTES: FreewayWaypoint[][] = [FREEWAY_I80, FREEWAY_101, FREEWAY_880, FREEWAY_280];

/** @deprecated use FREEWAY_I80 */
export const FREEWAY_ROUTE = FREEWAY_I80;

export const BAY_WATER_BOUNDS = {
  minX: -280,
  maxX: 820,
  minZ: -580,
  maxZ: 560,
  centerZ: -10,
  depthZ: 1140
};

export const DRIVE_TUNING = {
  maxEngineForce: 5500,
  maxBrakingForce: 140,
  maxSteering: 0.36,
  mass: 1050,
  linearDamping: 0.02
} as const;
