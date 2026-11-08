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
    maxX: 1220,
    minZ: -520,
    maxZ: 520,
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

/**
 * Freeway polylines — compressed Bay Area (+X east, +Z north).
 * Topology aligned with regional freeway maps (Google Maps / Caltrans / IBAHM):
 * I-80 trans-bay spine, US-101 & I-280 peninsula pair, I-880 east shore, SR-24, I-680, I-580, I-780.
 */
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
  { x: 720, z: -140, y: 0 },
  { x: 700, z: 60, y: 0 },
  { x: 680, z: 240, y: 0 },
  { x: 640, z: 440, y: 0 },
  { x: 580, z: 660, y: 0 },
  { x: 520, z: 880, y: 0 },
  { x: 500, z: 1020, y: 0 },
  { x: 520, z: 1180, y: 2 }
];

/** US-101: Bayshore Fwy SF → Peninsula (bay side) → San José. */
export const FREEWAY_101: FreewayWaypoint[] = [
  { x: -820, z: -520, y: 0 },
  { x: -800, z: -620, y: 0 },
  { x: -760, z: -820, y: 0 },
  { x: -680, z: -1020, y: 0 },
  { x: -520, z: -1240, y: 0 },
  { x: -300, z: -1420, y: 0 },
  { x: -40, z: -1580, y: 0 },
  { x: 260, z: -1720, y: 0 },
  { x: 520, z: -1820, y: 0 }
];

/** I-880: Nimitz Fwy — San José → Fremont → Oakland (MacArthur Maze). */
export const FREEWAY_880: FreewayWaypoint[] = [
  { x: 460, z: -1795, y: 0 },
  { x: 600, z: -1680, y: 0 },
  { x: 760, z: -1500, y: 0 },
  { x: 860, z: -1280, y: 0 },
  { x: 900, z: -1040, y: 0 },
  { x: 900, z: -760, y: 0 },
  { x: 880, z: -500, y: 0 },
  { x: 840, z: -340, y: 0 },
  { x: 800, z: -295, y: 0 }
];

/** SR-24: Oakland hills → Caldecott → Orinda → Walnut Creek. */
export const FREEWAY_24: FreewayWaypoint[] = [
  { x: 620, z: -40, y: 0 },
  { x: 520, z: 110, y: 2 },
  { x: 392, z: 262, y: 6 },
  { x: 458, z: 332, y: 4 },
  { x: 720, z: 198, y: 2 },
  { x: 920, z: 118, y: 0 },
  { x: 1105, z: 48, y: 0 }
];

/** I-280: Junipero Serra — inland, west of US-101. */
export const FREEWAY_280: FreewayWaypoint[] = [
  { x: -780, z: -560, y: 0 },
  { x: -720, z: -780, y: 0 },
  { x: -640, z: -980, y: 0 },
  { x: -520, z: -1180, y: 0 },
  { x: -340, z: -1380, y: 0 },
  { x: -120, z: -1560, y: 0 },
  { x: 80, z: -1680, y: 0 }
];

/** I-680: Walnut Creek → Sunol grade → east South Bay → San José. */
export const FREEWAY_680: FreewayWaypoint[] = [
  { x: 1105, z: 48, y: 0 },
  { x: 1120, z: -100, y: 0 },
  { x: 1100, z: -320, y: 0 },
  { x: 1060, z: -560, y: 0 },
  { x: 1000, z: -820, y: 0 },
  { x: 920, z: -1080, y: 0 },
  { x: 840, z: -1320, y: 0 },
  { x: 720, z: -1540, y: 0 },
  { x: 540, z: -1740, y: 0 }
];

/** I-580: Richmond–San Rafael bridge approach into Marin. */
export const FREEWAY_580: FreewayWaypoint[] = [
  { x: 640, z: 440, y: 0 },
  { x: 420, z: 500, y: 0 },
  { x: 120, z: 540, y: 2 },
  { x: -220, z: 500, y: 4 },
  { x: -580, z: 420, y: 2 },
  { x: -920, z: 340, y: 0 },
  { x: -1120, z: 300, y: 0 }
];

/** I-780: Carquinez bridge Vallejo ↔ Martinez. */
export const FREEWAY_780: FreewayWaypoint[] = [
  { x: 480, z: 980, y: 0 },
  { x: 620, z: 860, y: 3 },
  { x: 820, z: 680, y: 5 },
  { x: 1000, z: 520, y: 4 },
  { x: 1110, z: 415, y: 0 }
];

/** All drivable freeway spines for the bay loop. */
export const FREEWAY_ROUTES: FreewayWaypoint[][] = [
  FREEWAY_I80,
  FREEWAY_101,
  FREEWAY_880,
  FREEWAY_280,
  FREEWAY_24,
  FREEWAY_680,
  FREEWAY_580,
  FREEWAY_780
];

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
