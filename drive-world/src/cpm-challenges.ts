import type { DistrictId } from './world-config';

export type DriftPadDef = {
  id: string;
  name: string;
  district: DistrictId;
  x: number;
  z: number;
  radius: number;
  goalScore: number;
};

export type DragStripDef = {
  id: string;
  name: string;
  district: DistrictId;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  gateWidth: number;
};

export type TimeAttackDef = {
  id: string;
  name: string;
  district: DistrictId;
  gates: { x: number; z: number; radius: number }[];
};

export const DRIFT_PADS: DriftPadDef[] = [
  {
    id: 'vallejo-yard',
    name: 'Vallejo yard drift',
    district: 'vallejo',
    x: 465,
    z: 955,
    radius: 42,
    goalScore: 500
  },
  {
    id: 'oakland-arena-lot',
    name: 'Oakland arena lot',
    district: 'eastBay',
    x: 775,
    z: -190,
    radius: 38,
    goalScore: 750
  }
];

export const DRAG_STRIPS: DragStripDef[] = [
  {
    id: 'mare-quarter',
    name: 'Mare Island quarter mile',
    district: 'vallejo',
    startX: 418,
    startZ: 1005,
    endX: 558,
    endZ: 1005,
    gateWidth: 14
  },
  {
    id: 'peninsula-drag',
    name: 'Peninsula industrial',
    district: 'peninsula',
    startX: -620,
    startZ: -1210,
    endX: -440,
    endZ: -1210,
    gateWidth: 14
  }
];

export const TIME_ATTACKS: TimeAttackDef[] = [
  {
    id: 'vallejo-harbor',
    name: 'Vallejo harbor loop',
    district: 'vallejo',
    gates: [
      { x: 500, z: 900, radius: 28 },
      { x: 444, z: 1020, radius: 32 },
      { x: 540, z: 920, radius: 28 }
    ]
  },
  {
    id: 'emeryville-strip',
    name: 'Emeryville Bay St',
    district: 'eastBay',
    gates: [
      { x: 598, z: -248, radius: 30 },
      { x: 620, z: -120, radius: 28 },
      { x: 538, z: -120, radius: 30 }
    ]
  }
];

export type CpmZoneHit =
  | { kind: 'drift'; pad: DriftPadDef; score: number }
  | { kind: 'drag-countdown'; strip: DragStripDef; step: number }
  | { kind: 'drag-go'; strip: DragStripDef }
  | { kind: 'drag-finish'; strip: DragStripDef; etSec: number }
  | { kind: 'time-gate'; attack: TimeAttackDef; gateIndex: number }
  | { kind: 'time-finish'; attack: TimeAttackDef; ms: number };
