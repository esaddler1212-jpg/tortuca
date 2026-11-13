import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import type { BayQualityPreset } from './bay-quality';
import { snapToBayGround } from './openworldjs/ground-snap';
import { FREEWAY_101, FREEWAY_880, FREEWAY_I80 } from './world-config';

type FreewayDrone = {
  root: Entity;
  path: { x: number; z: number }[];
  seg: number;
  t: number;
  speed: number;
};

const drones: FreewayDrone[] = [];

function slicePath(waypoints: { x: number; z: number }[], start: number, end: number) {
  return waypoints.slice(start, end).map((p) => ({ x: p.x, z: p.z }));
}

/** Preset caps — Chromebook stays ≤3 drones total on main arteries. */
export const FREEWAY_DRONE_BUDGET: Record<BayQualityPreset, number> = {
  chromebook: 3,
  balanced: 6,
  console: 6,
  lush: 9
};

const ARTERY_LOOPS: { id: string; path: (preset: BayQualityPreset) => { x: number; z: number }[] }[] = [
  {
    id: 'i80',
    path: (preset) =>
      slicePath(
        FREEWAY_I80,
        preset === 'chromebook' ? 6 : 3,
        preset === 'lush' ? 14 : preset === 'chromebook' ? 10 : 12
      )
  },
  {
    id: '880',
    path: (preset) =>
      slicePath(
        FREEWAY_880,
        preset === 'chromebook' ? 5 : 2,
        preset === 'lush' ? 12 : preset === 'chromebook' ? 9 : 10
      )
  },
  {
    id: '101',
    path: (preset) =>
      slicePath(
        FREEWAY_101,
        preset === 'chromebook' ? 4 : 2,
        preset === 'lush' ? 11 : preset === 'chromebook' ? 8 : 9
      )
  }
];

export function freewayDroneCountForPreset(preset: BayQualityPreset): number {
  return FREEWAY_DRONE_BUDGET[preset];
}

export function spawnFreewayTrafficDrones(app: AppBase, preset: BayQualityPreset = 'balanced'): void {
  for (const d of drones) d.root.destroy();
  drones.length = 0;

  const cap = FREEWAY_DRONE_BUDGET[preset];
  const perRoute = Math.max(1, Math.floor(cap / ARTERY_LOOPS.length));

  const mat = new StandardMaterial();
  mat.diffuse = new Color(0.35, 0.55, 0.95);
  mat.emissive = new Color(0.2, 0.65, 1);
  mat.emissiveIntensity = preset === 'chromebook' ? 0.45 : 0.65;
  mat.opacity = 0.92;
  mat.blendType = 2;
  mat.update();

  let idx = 0;
  for (const artery of ARTERY_LOOPS) {
    const path = artery.path(preset);
    if (path.length < 2) continue;
    for (let i = 0; i < perRoute && drones.length < cap; i++) {
      const root = new Entity(`freeway-drone-${artery.id}-${idx++}`);
      root.setLocalScale(0.85, 0.35, 1.15);
      root.addComponent('render', { type: 'box', material: mat });
      app.root.addChild(root);
      drones.push({
        root,
        path,
        seg: i % Math.max(1, path.length - 1),
        t: i * 0.22,
        speed: (preset === 'chromebook' ? 0.14 : 0.17) + i * 0.012
      });
    }
  }
}

export function updateFreewayTrafficDrones(dt: number, enabled: boolean): void {
  if (!enabled) return;
  for (const drone of drones) {
    if (drone.path.length < 2) continue;
    drone.t += drone.speed * dt;
    if (drone.t >= 1) {
      drone.t = 0;
      drone.seg = (drone.seg + 1) % (drone.path.length - 1);
    }
    const a = drone.path[drone.seg];
    const b = drone.path[drone.seg + 1];
    const x = a.x + (b.x - a.x) * drone.t;
    const z = a.z + (b.z - a.z) * drone.t;
    drone.root.setPosition(x, snapToBayGround(x, z, 2.8), z);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    drone.root.setEulerAngles(-8, (Math.atan2(dx, dz) * 180) / Math.PI, 0);
  }
}
