import type { AppBase } from 'playcanvas';

import { CITY_HUBS } from './city-map-registry';
import { type KenneySlot, placeKenneyPackSlots } from './build-kenney-props';
import { FREEWAY_101, FREEWAY_880, FREEWAY_I80 } from './world-config';

type FreewayPin = { id: string; x: number; z: number };

const FREIGHT_SLOTS: KenneySlot[] = [
  { dx: 0, dz: 18, scale: 2.1, yaw: 45, fileIdx: 6 },
  { dx: -14, dz: -16, scale: 1.9, yaw: -30, fileIdx: 9 }
];

const HUB_SLOTS: KenneySlot[] = [
  { dx: 32, dz: 28, scale: 2.4, yaw: 20, fileIdx: 4 },
  { dx: -28, dz: 24, scale: 2.2, yaw: -12, fileIdx: 11 }
];

function freewayPins(): FreewayPin[] {
  const pick = (ids: number[], route: typeof FREEWAY_I80): FreewayPin[] =>
    ids.map((i) => {
      const p = route[i];
      if (!p) return null;
      return { id: `w${i}`, x: p.x, z: p.z };
    }).filter((p): p is FreewayPin => !!p);

  return [
    ...pick([0, 4, 7, 11, 14], FREEWAY_I80),
    ...pick([1, 5], FREEWAY_101),
    ...pick([2, 6], FREEWAY_880)
  ];
}

/** Tier 4 — Kenney silhouettes along main arteries + city hubs (when `kenney-city/` installed). */
export async function placeFreewayKenneyProps(app: AppBase): Promise<number> {
  let placed = 0;
  for (const pin of freewayPins()) {
    placed += await placeKenneyPackSlots(
      app,
      'kenney-city',
      pin.x,
      pin.z,
      `freeway-kenney-${pin.id}`,
      FREIGHT_SLOTS
    );
  }
  for (const hub of CITY_HUBS) {
    placed += await placeKenneyPackSlots(
      app,
      'kenney-city',
      hub.centerX,
      hub.centerZ,
      `hub-kenney-${hub.id}`,
      HUB_SLOTS
    );
  }
  return placed;
}