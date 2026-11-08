import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import type { BayQualityPreset } from './bay-quality';
import { CITY_HUBS } from './city-map-registry';
import { hillOffsetM } from './bay-terrain';

type HubCar = { root: Entity; path: { x: number; z: number }[]; seg: number; t: number; speed: number };

const hubCars: HubCar[] = [];

const HUB_TRAFFIC_IDS = new Set([
  'vallejo-harbor',
  'sf-downtown',
  'oakland-lake',
  'marin-bridge',
  'peninsula-mid',
  'sj-downtown'
]);

function loopAround(cx: number, cz: number, r: number) {
  return [
    { x: cx - r, z: cz - r },
    { x: cx + r, z: cz - r },
    { x: cx + r, z: cz + r },
    { x: cx - r, z: cz + r },
    { x: cx - r, z: cz - r }
  ];
}

export function spawnHubStreetTraffic(app: AppBase, preset: BayQualityPreset = 'balanced'): void {
  for (const car of hubCars) car.root.destroy();
  hubCars.length = 0;

  const maxHubs = preset === 'lush' ? 6 : preset === 'chromebook' ? 3 : 5;
  const carsPerHub = preset === 'lush' ? 2 : 1;
  const speed = preset === 'chromebook' ? 0.07 : 0.09;

  const mat = new StandardMaterial();
  mat.diffuse = new Color(0.42, 0.44, 0.5);
  mat.emissive = new Color(0.85, 0.45, 0.25);
  mat.emissiveIntensity = 0.18;
  mat.update();

  let idx = 0;
  for (const hub of CITY_HUBS) {
    if (!HUB_TRAFFIC_IDS.has(hub.id)) continue;
    if (idx >= maxHubs) break;
    idx++;
    const r = (hub.blockM ?? 50) * 1.05;
    const path = loopAround(hub.centerX, hub.centerZ, r);
    for (let i = 0; i < carsPerHub; i++) {
      const root = new Entity(`hub-traffic-${hub.id}-${i}`);
      root.setLocalScale(1.45, 0.5, 2);
      root.addComponent('render', { type: 'box', material: mat });
      app.root.addChild(root);
      hubCars.push({
        root,
        path,
        seg: i % Math.max(1, path.length - 1),
        t: i * 0.25,
        speed: speed + i * 0.008
      });
    }
  }
}

export function updateHubStreetTraffic(dt: number, enabled: boolean): void {
  if (!enabled) return;
  for (const car of hubCars) {
    if (car.path.length < 2) continue;
    car.t += car.speed * dt;
    if (car.t >= 1) {
      car.t = 0;
      car.seg = (car.seg + 1) % (car.path.length - 1);
    }
    const a = car.path[car.seg];
    const b = car.path[car.seg + 1];
    const x = a.x + (b.x - a.x) * car.t;
    const z = a.z + (b.z - a.z) * car.t;
    car.root.setPosition(x, hillOffsetM(x, z) + 1.35, z);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    car.root.setEulerAngles(0, (Math.atan2(dx, dz) * 180) / Math.PI, 0);
  }
}
