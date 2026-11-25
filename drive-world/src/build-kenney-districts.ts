import type { AppBase } from 'playcanvas';

import { type KenneySlot, placeKenneyPackSlots, placeKenneySlots } from './build-kenney-props';
import { EAST_BAY_LAKE } from './build-eastbay-lake-kit';
import { PENINSULA_SFO_GATE } from './build-peninsula-sfo-kit';
import { SOUTH_BAY_SAP } from './build-southbay-sap-kit';
import { MARIN_GG_VISTA } from './build-marin-bridge-kit';
import { SF_FERRY_POINT } from './build-sf-ferry-kit';
import { VALLEJO_SAFEHOUSE } from './landmark-registry';

const VALLEJO_SLOTS: KenneySlot[] = [
  { dx: -72, dz: -48, scale: 2.8, yaw: 12, fileIdx: 0 },
  { dx: 68, dz: -42, scale: 3.1, yaw: -18, fileIdx: 1 },
  { dx: -58, dz: 62, scale: 2.6, yaw: 90, fileIdx: 2 },
  { dx: 55, dz: 58, scale: 2.4, yaw: -75, fileIdx: 3 }
];

const MARIN_GG_SLOTS: KenneySlot[] = [
  { dx: -68, dz: 42, scale: 2.6, yaw: -15, fileIdx: 9 },
  { dx: 72, dz: 38, scale: 2.8, yaw: 22, fileIdx: 10 },
  { dx: -55, dz: -70, scale: 2.5, yaw: 100, fileIdx: 11 },
  { dx: 48, dz: -65, scale: 2.4, yaw: -88, fileIdx: 12 }
];

const SOUTH_BAY_SLOTS: KenneySlot[] = [
  { dx: -50, dz: 42, scale: 2.8, yaw: 20, fileIdx: 21 },
  { dx: 54, dz: 38, scale: 3.0, yaw: -16, fileIdx: 22 },
  { dx: -42, dz: -50, scale: 2.6, yaw: 88, fileIdx: 23 },
  { dx: 48, dz: -46, scale: 2.7, yaw: -92, fileIdx: 0 }
];

const PENINSULA_SFO_SLOTS: KenneySlot[] = [
  { dx: -52, dz: 38, scale: 3.0, yaw: 18, fileIdx: 17 },
  { dx: 58, dz: 35, scale: 3.2, yaw: -14, fileIdx: 18 },
  { dx: -44, dz: -58, scale: 2.8, yaw: 92, fileIdx: 19 },
  { dx: 50, dz: -52, scale: 2.9, yaw: -95, fileIdx: 20 }
];

const EAST_BAY_SLOTS: KenneySlot[] = [
  { dx: -58, dz: 48, scale: 2.7, yaw: 30, fileIdx: 13 },
  { dx: 62, dz: 44, scale: 2.9, yaw: -12, fileIdx: 14 },
  { dx: -48, dz: -55, scale: 2.5, yaw: 95, fileIdx: 15 },
  { dx: 52, dz: -48, scale: 2.6, yaw: -88, fileIdx: 16 }
];

const SF_FERRY_SLOTS: KenneySlot[] = [
  { dx: -95, dz: 35, scale: 3.4, yaw: 8, fileIdx: 4 },
  { dx: 88, dz: 28, scale: 3.0, yaw: -22, fileIdx: 5 },
  { dx: -42, dz: -78, scale: 2.7, yaw: 145, fileIdx: 6 },
  { dx: 105, dz: -62, scale: 3.2, yaw: -110, fileIdx: 7 },
  { dx: -118, dz: -35, scale: 2.9, yaw: 42, fileIdx: 8 }
];

export async function placeVallejoKenneyProps(app: AppBase): Promise<number> {
  return placeKenneySlots(app, VALLEJO_SAFEHOUSE.x, VALLEJO_SAFEHOUSE.z, 'vallejo-kenney-props', VALLEJO_SLOTS);
}

export async function placeSfFerryKenneyProps(app: AppBase): Promise<number> {
  return placeKenneySlots(app, SF_FERRY_POINT.x, SF_FERRY_POINT.z, 'sf-ferry-kenney-props', SF_FERRY_SLOTS);
}

export async function placeMarinBridgeKenneyProps(app: AppBase): Promise<number> {
  return placeKenneySlots(app, MARIN_GG_VISTA.x, MARIN_GG_VISTA.z, 'marin-bridge-kenney-props', MARIN_GG_SLOTS);
}

export async function placeSouthbaySapKenneyProps(app: AppBase): Promise<number> {
  return placeKenneySlots(app, SOUTH_BAY_SAP.x, SOUTH_BAY_SAP.z, 'southbay-sap-kenney-props', SOUTH_BAY_SLOTS);
}

export async function placePeninsulaSfoKenneyProps(app: AppBase): Promise<number> {
  return placeKenneySlots(
    app,
    PENINSULA_SFO_GATE.x,
    PENINSULA_SFO_GATE.z,
    'peninsula-sfo-kenney-props',
    PENINSULA_SFO_SLOTS
  );
}

export async function placeEastbayLakeKenneyProps(app: AppBase): Promise<number> {
  return placeKenneySlots(app, EAST_BAY_LAKE.x, EAST_BAY_LAKE.z, 'eastbay-lake-kenney-props', EAST_BAY_SLOTS);
}

const MODULAR_ANCHOR_SLOTS: KenneySlot[] = [
  { dx: -22, dz: 16, scale: 2.2, yaw: 12, fileIdx: 0 },
  { dx: 24, dz: 14, scale: 2.4, yaw: -18, fileIdx: 1 }
];

const DISTRICT_MODULAR_ANCHORS: { x: number; z: number; id: string }[] = [
  { id: 'vallejo', x: VALLEJO_SAFEHOUSE.x, z: VALLEJO_SAFEHOUSE.z },
  { id: 'sf-ferry', x: SF_FERRY_POINT.x, z: SF_FERRY_POINT.z },
  { id: 'marin', x: MARIN_GG_VISTA.x, z: MARIN_GG_VISTA.z },
  { id: 'eastbay', x: EAST_BAY_LAKE.x, z: EAST_BAY_LAKE.z },
  { id: 'peninsula', x: PENINSULA_SFO_GATE.x, z: PENINSULA_SFO_GATE.z },
  { id: 'southbay', x: SOUTH_BAY_SAP.x, z: SOUTH_BAY_SAP.z }
];

export async function placeDistrictModularProps(app: AppBase): Promise<number> {
  let placed = 0;
  for (const a of DISTRICT_MODULAR_ANCHORS) {
    placed += await placeKenneyPackSlots(
      app,
      'kenney-modular',
      a.x,
      a.z,
      `modular-${a.id}-props`,
      MODULAR_ANCHOR_SLOTS
    );
  }
  return placed;
}

export async function placeDistrictKenneyProps(app: AppBase): Promise<number> {
  const a = await placeVallejoKenneyProps(app);
  const b = await placeSfFerryKenneyProps(app);
  const c = await placeMarinBridgeKenneyProps(app);
  const d = await placeEastbayLakeKenneyProps(app);
  const e = await placePeninsulaSfoKenneyProps(app);
  const f = await placeSouthbaySapKenneyProps(app);
  const g = await placeDistrictModularProps(app);
  return a + b + c + d + e + f + g;
}