import type { AppBase } from 'playcanvas';

import { type KenneySlot, placeKenneyPackSlots } from './build-kenney-props';
import { FREEWAY_101, FREEWAY_880, FREEWAY_I80 } from './world-config';

const ROAD_SLOTS: KenneySlot[] = [
  { dx: 6, dz: 0, scale: 1.15, yaw: 0, fileIdx: 2 },
  { dx: -6, dz: 0, scale: 1.1, yaw: 90, fileIdx: 5 },
  { dx: 0, dz: 10, scale: 1.05, yaw: 45, fileIdx: 8 }
];

function roadPins(): { id: string; x: number; z: number; yaw: number }[] {
  const along = (route: typeof FREEWAY_I80, indices: number[]): ReturnType<typeof roadPins> =>
    indices.flatMap((i) => {
      const a = route[i];
      const b = route[i + 1] ?? route[i - 1];
      if (!a || !b) return [];
      const yaw = (Math.atan2(b.x - a.x, b.z - a.z) * 180) / Math.PI;
      return [{ id: `${i}`, x: a.x, z: a.z, yaw }];
    });

  return [
    ...along(FREEWAY_I80, [2, 6, 10, 13]),
    ...along(FREEWAY_101, [2, 4]),
    ...along(FREEWAY_880, [1, 4, 7])
  ];
}

/** Tier 4 — Kenney road pieces on freeway pins when `kenney-roads/` is installed. */
export async function placeFreewayRoadProps(app: AppBase): Promise<number> {
  let placed = 0;
  for (const pin of roadPins()) {
    const slots = ROAD_SLOTS.map((s) => ({ ...s, yaw: s.yaw + pin.yaw }));
    placed += await placeKenneyPackSlots(
      app,
      'kenney-roads',
      pin.x,
      pin.z,
      `road-kenney-${pin.id}`,
      slots
    );
  }
  return placed;
}