import type { AppBase } from 'playcanvas';

import { CITY_HUBS } from './city-map-registry';
import { type KenneySlot, placeKenneyPackSlots } from './build-kenney-props';

const SUBURBAN_SLOTS: KenneySlot[] = [
  { dx: 24, dz: 22, scale: 1.7, yaw: 15, fileIdx: 3 },
  { dx: -20, dz: 26, scale: 1.65, yaw: -20, fileIdx: 7 },
  { dx: 14, dz: -18, scale: 1.55, yaw: 40, fileIdx: 12 }
];

const SUBURBAN_DISTRICTS = new Set(['peninsula', 'southBay', 'marin']);

/** Tier 4 — suburban kit at South Bay / Peninsula / Marin hubs when `kenney-suburban/` installed. */
export async function placeSuburbanKenneyProps(app: AppBase): Promise<number> {
  let placed = 0;
  for (const hub of CITY_HUBS) {
    if (!SUBURBAN_DISTRICTS.has(hub.district)) continue;
    placed += await placeKenneyPackSlots(
      app,
      'kenney-suburban',
      hub.centerX,
      hub.centerZ,
      `suburban-kenney-${hub.id}`,
      SUBURBAN_SLOTS
    );
  }
  return placed;
}