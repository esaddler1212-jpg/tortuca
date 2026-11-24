import type { AppBase } from 'playcanvas';

import { VALLEJO_SAFEHOUSE } from './landmark-registry';
import { type KenneySlot, placeKenneyPackSlots } from './build-kenney-props';
import { MARIN_GG_VISTA } from './build-marin-bridge-kit';
import { SF_FERRY_POINT } from './build-sf-ferry-kit';

const NATURE_SLOTS: KenneySlot[] = [
  { dx: 12, dz: 20, scale: 1.4, yaw: 0, fileIdx: 0 },
  { dx: -16, dz: 18, scale: 1.5, yaw: 40, fileIdx: 1 },
  { dx: 8, dz: -14, scale: 1.3, yaw: -25, fileIdx: 2 }
];

const NATURE_ANCHORS = [
  { id: 'vallejo', x: VALLEJO_SAFEHOUSE.x, z: VALLEJO_SAFEHOUSE.z },
  { id: 'marin', x: MARIN_GG_VISTA.x, z: MARIN_GG_VISTA.z },
  { id: 'sf-ferry', x: SF_FERRY_POINT.x, z: SF_FERRY_POINT.z }
] as const;

/** Tier 4 — Kenney Nature (trees/rocks) when `kenney-nature/` installed. */
export async function placeNatureKenneyProps(app: AppBase): Promise<number> {
  let placed = 0;
  for (const a of NATURE_ANCHORS) {
    placed += await placeKenneyPackSlots(
      app,
      'kenney-nature',
      a.x,
      a.z,
      `nature-kenney-${a.id}`,
      NATURE_SLOTS
    );
  }
  return placed;
}