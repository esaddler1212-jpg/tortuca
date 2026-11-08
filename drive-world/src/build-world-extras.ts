import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import { CRUISE_VISTAS } from './cruise-vistas';
import { COLLECTIBLES } from './world-extras';
import { FREEWAY_I80 } from './world-config';

/** Switchback blocks — Lombard-inspired. */
export function buildLombardStreet(app: AppBase): void {
  const mat = new StandardMaterial();
  mat.diffuse = new Color(0.12, 0.14, 0.1);
  mat.emissive = new Color(0.15, 0.35, 0.2);
  mat.emissiveIntensity = 0.25;
  mat.update();

  const x0 = -820;
  let z = -680;
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

export function spawnAmbientTraffic(app: AppBase): void {
  const path = FREEWAY_I80.slice(4, 10).map((p) => ({ x: p.x, z: p.z }));
  const mat = new StandardMaterial();
  mat.diffuse = new Color(0.5, 0.52, 0.55);
  mat.emissive = new Color(0.2, 0.5, 0.65);
  mat.emissiveIntensity = 0.2;
  mat.update();

  for (let i = 0; i < 4; i++) {
    const root = new Entity(`traffic-${i}`);
    root.setLocalScale(1.6, 0.55, 2.2);
    root.addComponent('render', { type: 'box', material: mat });
    app.root.addChild(root);
    traffic.push({
      root,
      path,
      seg: i % Math.max(1, path.length - 1),
      t: i * 0.22,
      speed: 0.12 + i * 0.02
    });
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
