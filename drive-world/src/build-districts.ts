import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import { BAY_WINDOW_LIGHTS, hash2 } from './night-palette';
import { DISTRICTS, FREEWAY_ROUTE, FREEWAY_WIDTH_M, type DistrictId, type DistrictSpec } from './world-config';

const BUILDING_BASE = new Color(0.07, 0.075, 0.1);

const LAMP_MAT = (() => {
  const m = new StandardMaterial();
  m.emissive = new Color(1, 0.88, 0.6);
  m.emissiveIntensity = 1.8;
  m.diffuse = new Color(0.1, 0.1, 0.12);
  m.update();
  return m;
})();

function buildingMaterial(index: number): StandardMaterial {
  const accent = BAY_WINDOW_LIGHTS[index % BAY_WINDOW_LIGHTS.length];
  const mat = new StandardMaterial();
  mat.diffuse = BUILDING_BASE;
  mat.emissive = accent;
  mat.emissiveIntensity = 0.75;
  mat.gloss = 0.15;
  mat.update();
  return mat;
}

function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const vx = bx - ax;
  const vz = bz - az;
  const len2 = vx * vx + vz * vz;
  if (len2 < 1e-6) return Math.hypot(px - ax, pz - az);
  let t = ((px - ax) * vx + (pz - az) * vz) / len2;
  t = Math.max(0, Math.min(1, t));
  const nx = ax + t * vx;
  const nz = az + t * vz;
  return Math.hypot(px - nx, pz - nz);
}

function tooCloseToFreeway(x: number, z: number): boolean {
  const clearance = FREEWAY_WIDTH_M * 0.55 + 20;
  for (let i = 0; i < FREEWAY_ROUTE.length - 1; i++) {
    const a = FREEWAY_ROUTE[i];
    const b = FREEWAY_ROUTE[i + 1];
    if (distToSegment(x, z, a.x, a.z, b.x, b.z) < clearance) return true;
  }
  return false;
}

function buildDistrict(app: AppBase, spec: DistrictSpec, materials: StandardMaterial[]): void {
  for (let bx = spec.minX; bx < spec.maxX; bx += spec.blockM) {
    for (let bz = spec.minZ; bz < spec.maxZ; bz += spec.blockM) {
      const cx = bx + spec.blockM * 0.5;
      const cz = bz + spec.blockM * 0.5;
      if (tooCloseToFreeway(cx, cz)) continue;

      const roll = hash2(cx, cz);
      if (roll < 0.14) continue;

      const count = roll > 0.78 ? 2 : 1;
      for (let t = 0; t < count; t++) {
        const ox = (hash2(cx + t, cz) - 0.5) * (spec.blockM * 0.35);
        const oz = (hash2(cz + t, cx) - 0.5) * (spec.blockM * 0.35);
        const x = cx + ox;
        const z = cz + oz;

        const groundY = spec.flat ? hash2(x, z) * 1.2 : hillOffsetM(x, z);
        const footprint =
          spec.footprintMin + hash2(x, z) * (spec.footprintMax - spec.footprintMin);
        const height =
          (spec.heightMin + hash2(z, x) * (spec.heightMax - spec.heightMin)) * spec.heightMul;
        const matIndex = Math.floor(hash2(x + height, z) * BAY_WINDOW_LIGHTS.length);

        const tower = new Entity(`${spec.id}-${Math.round(x)}-${Math.round(z)}`);
        tower.setLocalScale(footprint, height, footprint);
        tower.setPosition(x, groundY + height * 0.5, z);
        tower.addComponent('render', { type: 'box', material: materials[matIndex] });
        tower.addComponent('collision', {
          type: 'box',
          halfExtents: new Vec3(footprint / 2, height / 2, footprint / 2)
        });
        tower.addComponent('rigidbody', { type: 'static' });
        app.root.addChild(tower);
      }
    }
  }
}

function addDistrictSign(app: AppBase, spec: DistrictSpec, x: number, z: number): void {
  const pole = new Entity(`sign-${spec.id}`);
  pole.setLocalScale(2, 16, 0.6);
  pole.setPosition(x, 8, z);
  const signMat = new StandardMaterial();
  signMat.emissive = new Color(0.2, 0.55, 0.95);
  signMat.emissiveIntensity = 0.9;
  signMat.update();
  pole.addComponent('render', { type: 'box', material: signMat });
  app.root.addChild(pole);
}

export function buildAllDistricts(app: AppBase): void {
  const materials = BAY_WINDOW_LIGHTS.map((_, i) => buildingMaterial(i));

  (Object.keys(DISTRICTS) as DistrictId[]).forEach((id) => {
    buildDistrict(app, DISTRICTS[id], materials);
  });

  addDistrictSign(app, DISTRICTS.sf, -680, -320);
  addDistrictSign(app, DISTRICTS.eastBay, 120, 620);
  addDistrictSign(app, DISTRICTS.vallejo, 820, 1180);
}

export function buildFreewayLamps(app: AppBase, spacing: number, limit: number): void {
  let count = 0;
  for (let i = 0; i < FREEWAY_ROUTE.length - 1 && count < limit; i++) {
    const a = FREEWAY_ROUTE[i];
    const b = FREEWAY_ROUTE[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.floor(len / spacing));
    for (let s = 0; s <= steps && count < limit; s++) {
      const t = s / steps;
      const x = a.x + dx * t;
      const z = a.z + dz * t;
      const y = hillOffsetM(x, z) + ((a.y ?? 0) + (b.y ?? 0)) * 0.5;
      const nx = (-dz / len) * (FREEWAY_WIDTH_M * 0.55);
      const nz = (dx / len) * (FREEWAY_WIDTH_M * 0.55);

      const pole = new Entity(`fw-lamp-${count}`);
      pole.setLocalScale(0.35, 5.5, 0.35);
      pole.setPosition(x + nx, y + 2.75, z + nz);
      pole.addComponent('render', { type: 'box', material: LAMP_MAT });
      app.root.addChild(pole);

      const bulb = new Entity(`fw-lamp-light-${count}`);
      bulb.setPosition(x + nx, y + 5.2, z + nz);
      bulb.addComponent('light', {
        type: 'point',
        color: new Color(1, 0.82, 0.55),
        intensity: 1.4,
        range: 42,
        castShadows: false
      });
      app.root.addChild(bulb);
      count++;
    }
  }
}
