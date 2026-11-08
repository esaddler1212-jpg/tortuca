import { Vec3 } from 'playcanvas';

/**
 * Game axes (Bay Area reference map): +X east, +Z north.
 * Playable corridor: San Francisco (west) → Bay Bridge → East Bay → I-80 → Vallejo (North Bay).
 * ~10 mi ≈ 16 km on the reference map → compressed to ~3.2 km along FREEWAY_ROUTE.
 */
export const WORLD_HALF_M = 2000;

export const FREEWAY_WIDTH_M = 34;
export const STRIPE_SPACING_M = 36;

/** Spawn on I-80 in SF, heading east toward the bay. */
export const SPAWN_SF = new Vec3(-760, 2.2, -490);

export type DistrictId = 'sf' | 'eastBay' | 'vallejo';

/** Future map regions (reference): northBay, peninsula, southBay — not built yet. */
export type MapRegionId = DistrictId | 'northBay' | 'peninsula' | 'southBay';

export interface DistrictSpec {
  id: DistrictId;
  label: string;
  /** Reference map macro-region label. */
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
    mapRegion: 'San Francisco (peninsula tip)',
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
  eastBay: {
    id: 'eastBay',
    label: 'Oakland / East Bay',
    mapRegion: 'East Bay',
    minX: 320,
    maxX: 1180,
    minZ: -520,
    maxZ: 420,
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
  }
};

/**
 * Realistic path: I-80 east across San Francisco–Oakland Bay Bridge, touchdown Oakland,
 * then I-80 north beside the bay to Vallejo.
 */
export const FREEWAY_ROUTE: { x: number; z: number; y?: number }[] = [
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

/** San Francisco Bay water between peninsula and East Bay / North Bay. */
export const BAY_WATER_BOUNDS = {
  minX: -120,
  maxX: 720,
  minZ: -540,
  maxZ: 520,
  centerZ: -10,
  depthZ: 1060
};

export const DRIVE_TUNING = {
  maxEngineForce: 5500,
  maxBrakingForce: 140,
  maxSteering: 0.36,
  mass: 1050,
  linearDamping: 0.02
} as const;
