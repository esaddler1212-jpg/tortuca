import type { DistrictId } from './world-config';

export type CollectibleDef = {
  id: string;
  name: string;
  unlockPaintId: string;
  x: number;
  z: number;
  radius: number;
  /** Extra height above terrain (m). */
  yOffset?: number;
  /** Require player altitude within band of marker height. */
  requireAir?: boolean;
};

export type SpeedTrapDef = {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
};

export type ScenicRouteDef = {
  id: string;
  name: string;
  district: DistrictId;
  points: { x: number; z: number }[];
  checkpointRadius: number;
};

export const COLLECTIBLES: CollectibleDef[] = [
  { id: 'sourdough', name: 'Sourdough loaf', unlockPaintId: 'giants-orange', x: -800, z: -480, radius: 22 },
  { id: 'cable-token', name: 'Cable car token', unlockPaintId: 'cherry-red', x: -700, z: -650, radius: 22 },
  { id: 'tech-chip', name: 'Silicon wafer', unlockPaintId: 'neon-cyan', x: 500, z: -1450, radius: 24 },
  { id: 'anchor', name: 'Mare Island anchor', unlockPaintId: 'bridge-orange', x: 460, z: 1040, radius: 22 },
  { id: 'wine-cork', name: 'Napa cork', unlockPaintId: 'warriors-blue', x: -1100, z: 280, radius: 24 },
  {
    id: 'rotor-token',
    name: 'Rotor service token',
    unlockPaintId: 'neon-cyan',
    x: 545,
    z: 935,
    radius: 28,
    yOffset: 6
  },
  {
    id: 'sky-chip',
    name: 'Skyway nav chip',
    unlockPaintId: 'stealth',
    x: -40,
    z: -680,
    radius: 32,
    yOffset: 45,
    requireAir: true
  },
  {
    id: 'cave-key',
    name: 'Cave key',
    unlockPaintId: 'stealth',
    x: -655,
    z: -695,
    radius: 26
  },
  {
    id: 'mach-cog',
    name: 'Number 5 cog',
    unlockPaintId: 'cherry-red',
    x: 98,
    z: -1305,
    radius: 24
  }
];

export const SPEED_TRAPS: SpeedTrapDef[] = [
  { id: 'i80-bridge', name: 'Bay Bridge blast', x: 120, z: -448, radius: 38 },
  { id: '101-pen', name: '101 Peninsula', x: -520, z: -1380, radius: 40 },
  { id: '880-sj', name: '880 South', x: 740, z: -1280, radius: 40 }
];

export const SCENIC_ROUTES: ScenicRouteDef[] = [
  {
    id: 'highway-1-marin',
    name: 'Marin coast cruise',
    district: 'marin',
    checkpointRadius: 55,
    points: [
      { x: -1150, z: -200 },
      { x: -1180, z: 120 },
      { x: -1120, z: 420 }
    ]
  },
  {
    id: 'skyline-pen',
    name: 'Skyline Peninsula',
    district: 'peninsula',
    checkpointRadius: 50,
    points: [
      { x: -600, z: -1100 },
      { x: -320, z: -1250 },
      { x: -80, z: -1450 }
    ]
  },
  {
    id: 'bay-skylane',
    name: 'Bay skylane (aerial)',
    district: 'eastBay',
    checkpointRadius: 120,
    points: [
      { x: 120, z: -448 },
      { x: -200, z: 200 },
      { x: 520, z: 900 }
    ]
  }
];

export const FAST_TRAVEL: { district: DistrictId; label: string; x: number; z: number }[] = [
  { district: 'sf', label: 'San Francisco', x: -720, z: -520 },
  { district: 'marin', label: 'Marin', x: -1050, z: 200 },
  { district: 'eastBay', label: 'East Bay', x: 640, z: -280 },
  { district: 'vallejo', label: 'Vallejo', x: 520, z: 900 },
  { district: 'peninsula', label: 'Peninsula', x: -500, z: -1280 },
  { district: 'southBay', label: 'South Bay', x: 420, z: -1520 }
];
