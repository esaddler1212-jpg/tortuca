import type { AppBase } from 'playcanvas';

import { type KenneySlot, placeKenneySlots } from './build-kenney-props';
import { SF_FERRY_POINT } from './build-sf-ferry-kit';
import { VALLEJO_SAFEHOUSE } from './landmark-registry';

const VALLEJO_SLOTS: KenneySlot[] = [
  { dx: -72, dz: -48, scale: 2.8, yaw: 12, fileIdx: 0 },
  { dx: 68, dz: -42, scale: 3.1, yaw: -18, fileIdx: 1 },
  { dx: -58, dz: 62, scale: 2.6, yaw: 90, fileIdx: 2 },
  { dx: 55, dz: 58, scale: 2.4, yaw: -75, fileIdx: 3 }
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

export async function placeDistrictKenneyProps(app: AppBase): Promise<number> {
  const a = await placeVallejoKenneyProps(app);
  const b = await placeSfFerryKenneyProps(app);
  return a + b;
}