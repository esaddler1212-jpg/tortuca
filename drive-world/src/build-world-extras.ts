import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import type { BayQualityPreset } from './bay-quality';
import { hillOffsetM } from './bay-terrain';
import { CRUISE_VISTAS } from './cruise-vistas';
import { COLLECTIBLES } from './world-extras';
import { FREEWAY_101, FREEWAY_880, FREEWAY_I80 } from './world-config';

/** Switchback blocks — Lombard-inspired. */
export function buildLombardStreet(app: AppBase): void {
  const mat = new StandardMaterial();
  mat.diffuse = new Color(0.12, 0.14, 0.1);
  mat.emissive = new Color(0.15, 0.35, 0.2);
  mat.emissiveIntensity = 0.25;
  mat.update();

  const x0 = -820;
  const z = -680;
  for (let i = 0; i < 8; i++) {
    const y = hillOffsetM(x0 + i * 18, z) + 2 + i * 1.2;
    const seg = new Entity(`lombard-${i}`);
    seg.setLocalScale(16, 1.2, 28);
    seg.setPosition(x0 + i * 18, y, z + i * 22);
    seg.setEulerAngles(-8, 20, 0);
    seg.addComponent('render', { type: 'box', material: mat });
    seg.addComponent('collision', { type: 'box', halfExtents: new Vec3(8, 0.6, 14) });
    seg.addComponent('rigidbody', { type: 'static' });
    app.root.addChild(seg);
  }
}

export function buildCollectibles(app: AppBase): void {
  const mat = new StandardMaterial();
  mat.diffuse = new Color(0.9, 0.75, 0.2);
  mat.emissive = new Color(1, 0.85, 0.3);
  mat.emissiveIntensity = 0.9;
  mat.update();

  for (const c of COLLECTIBLES) {
    const y = hillOffsetM(c.x, c.z) + (c.yOffset ?? 3);
    const e = new Entity(`collectible-${c.id}`);
    e.setLocalScale(3.5, 3.5, 3.5);
    e.setPosition(c.x, y, c.z);
    e.addComponent('render', { type: 'sphere', material: mat });
    app.root.addChild(e);
  }
}

type TrafficCar = { root: Entity; path: { x: number; z: number }[]; seg: number; t: number; speed: number };

const traffic: TrafficCar[] = [];

type TrafficLoop = { path: { x: number; z: number }[]; cars: number; speed: number };

function pathFromFreeway(waypoints: { x: number; z: number }[], start: number, end: number) {
  return waypoints.slice(start, end).map((p) => ({ x: p.x, z: p.z }));
}

export function spawnAmbientTraffic(app: AppBase, preset: BayQualityPreset = 'balanced'): void {
  for (const car of traffic) car.root.destroy();
  traffic.length = 0;

  const loops: TrafficLoop[] =
    preset === 'chromebook'
      ? [
          { path: pathFromFreeway(FREEWAY_I80, 5, 9), cars: 2, speed: 0.11 },
          { path: pathFromFreeway(FREEWAY_880, 4, 8), cars: 2, speed: 0.1 }
        ]
      : preset === 'lush'
      ? [
          { path: pathFromFreeway(FREEWAY_I80, 3, 12), cars: 5, speed: 0.15 },
          { path: pathFromFreeway(FREEWAY_880, 2, 10), cars: 4, speed: 0.12 },
          { path: pathFromFreeway(FREEWAY_101, 1, 9), cars: 3, speed: 0.11 }
        ]
      : [
          { path: pathFromFreeway(FREEWAY_I80, 4, 10), cars: 4, speed: 0.13 },
          { path: pathFromFreeway(FREEWAY_880, 3, 9), cars: 3, speed: 0.11 },
          { path: pathFromFreeway(FREEWAY_101, 2, 8), cars: 2, speed: 0.1 }
        ];

  const mat = new StandardMaterial();
  mat.diffuse = new Color(0.5, 0.52, 0.55);
  mat.emissive = new Color(0.2, 0.5, 0.65);
  mat.emissiveIntensity = 0.2;
  mat.update();

  let idx = 0;
  for (const loop of loops) {
    if (loop.path.length < 2) continue;
    for (let i = 0; i < loop.cars; i++) {
      const root = new Entity(`traffic-${idx++}`);
      root.setLocalScale(1.6, 0.55, 2.2);
      root.addComponent('render', { type: 'box', material: mat });
      app.root.addChild(root);
      traffic.push({
        root,
        path: loop.path,
        seg: i % Math.max(1, loop.path.length - 1),
        t: i * 0.18,
        speed: loop.speed + i * 0.01
      });
    }
  }
}

export function updateAmbientTraffic(dt: number, enabled: boolean): void {
  if (!enabled) return;
  for (const car of traffic) {
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
    const y = hillOffsetM(x, z) + 1.5;
    car.root.setPosition(x, y, z);
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    car.root.setEulerAngles(0, (Math.atan2(dx, dz) * 180) / Math.PI, 0);
  }
}

export function buildCruiseVistas(app: AppBase): void {
  const rail = new StandardMaterial();
  rail.diffuse = new Color(0.25, 0.55, 0.85);
  rail.emissive = new Color(0.15, 0.35, 0.65);
  rail.emissiveIntensity = 0.35;
  rail.update();

  const sign = new StandardMaterial();
  sign.diffuse = new Color(0.12, 0.12, 0.14);
  sign.emissive = new Color(0.9, 0.55, 0.25);
  sign.emissiveIntensity = 0.55;
  sign.update();

  for (const v of CRUISE_VISTAS) {
    const y = hillOffsetM(v.x, v.z) + 0.6;
    const pad = new Entity(`vista-pad-${v.id}`);
    pad.setLocalScale(14, 0.35, 10);
    pad.setPosition(v.x, y, v.z);
    pad.addComponent('render', { type: 'box', material: rail });
    app.root.addChild(pad);

    const post = new Entity(`vista-sign-${v.id}`);
    post.setLocalScale(0.4, 3.2, 0.4);
    post.setPosition(v.x + 5, y + 1.8, v.z);
    post.addComponent('render', { type: 'box', material: sign });
    app.root.addChild(post);
  }
}
