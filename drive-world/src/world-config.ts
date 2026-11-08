import { Vec3 } from 'playcanvas';

/** Playable half-extent in metres (full width = 2 × WORLD_HALF_M). */
export const WORLD_HALF_M = 2000;

export const FREEWAY_WIDTH_M = 34;
export const STRIPE_SPACING_M = 36;

/** Stylised districts — SF (west) → East Bay → Vallejo (north-east). */
export const SPAWN_SF = new Vec3(-700, 2.2, -150);

export type DistrictId = 'sf' | 'eastBay' | 'vallejo';

export interface DistrictSpec {
  id: DistrictId;
  label: string;
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
  /** Skip procedural hills (Vallejo waterfront). */
  flat: boolean;
}

export const DISTRICTS: Record<DistrictId, DistrictSpec> = {
  sf: {
    id: 'sf',
    label: 'San Francisco',
    minX: -1150,
    maxX: -220,
    minZ: -850,
    maxZ: 380,
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
    label: 'East Bay',
    minX: -320,
    maxX: 520,
    minZ: 320,
    maxZ: 1050,
    blockM: 76,
    heightMin: 10,
    heightMax: 38,
    footprintMin: 16,
    footprintMax: 34,
    heightMul: 1,
    flat: false
  },
  vallejo: {
    id: 'vallejo',
    label: 'Vallejo',
    minX: 420,
    maxX: 1250,
    minZ: 920,
    maxZ: 1750,
    blockM: 80,
    heightMin: 8,
    heightMax: 28,
    footprintMin: 18,
    footprintMax: 40,
    heightMul: 0.9,
    flat: true
  }
};

/**
 * I-80 / Bay Bridge corridor — drivable spine from SF to Vallejo (compressed scale).
 * Optional `y` = deck elevation in metres.
 */
export const FREEWAY_ROUTE: { x: number; z: number; y?: number }[] = [
  { x: -780, z: -220, y: 0 },
  { x: -580, z: -80, y: 0 },
  { x: -380, z: 100, y: 0 },
  { x: -120, z: 260, y: 0 },
  { x: 80, z: 380, y: 4 },
  { x: 260, z: 520, y: 14 },
  { x: 440, z: 660, y: 24 },
  { x: 600, z: 800, y: 24 },
  { x: 720, z: 920, y: 12 },
  { x: 840, z: 1060, y: 4 },
  { x: 960, z: 1220, y: 0 }
];

export const BAY_WATER_BOUNDS = {
  minX: -900,
  maxX: 900,
  minZ: 180,
  maxZ: 920,
  centerZ: 520,
  depthZ: 900
};

/** Vehicle tuning — high top speed, no artificial caps. */
export const DRIVE_TUNING = {
  maxEngineForce: 5500,
  maxBrakingForce: 140,
  maxSteering: 0.36,
  mass: 1050,
  linearDamping: 0.02
} as const;
