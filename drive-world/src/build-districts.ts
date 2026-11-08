import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { CITY_HUBS, pointInCityHub, type CityHub } from './city-map-registry';
import { hillOffsetM } from './bay-terrain';
import { BAY_WINDOW_LIGHTS, hash2 } from './night-palette';
import { nearHubStreetGrid, tooCloseToFreeway } from './street-utils';
import { DISTRICTS, FREEWAY_ROUTES, FREEWAY_WIDTH_M, type DistrictId, type DistrictSpec } from './world-config';

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

function buildHubDistrict(app: AppBase, hub: CityHub, spec: DistrictSpec, materials: StandardMaterial[]): void {
  const blockM = hub.blockM ?? spec.blockM;
  const minX = hub.centerX - hub.radiusM;
  const maxX = hub.centerX + hub.radiusM;
  const minZ = hub.centerZ - hub.radiusM;
  const maxZ = hub.centerZ + hub.radiusM;

  for (let bx = minX; bx < maxX; bx += blockM) {
    for (let bz = minZ; bz < maxZ; bz += blockM) {
      const cx = bx + blockM * 0.5;
      const cz = bz + blockM * 0.5;
      if (!pointInCityHub(cx, cz, hub)) continue;
      if (tooCloseToFreeway(cx, cz)) continue;
      if (nearHubStreetGrid(cx, cz, hub)) continue;

      const roll = hash2(cx, cz);
      if (roll < 0.14) continue;

      const count = roll > 0.78 ? 2 : 1;
      for (let t = 0; t < count; t++) {
        const ox = (hash2(cx + t, cz) - 0.5) * (blockM * 0.35);
        const oz = (hash2(cz + t, cx) - 0.5) * (blockM * 0.35);
        const x = cx + ox;
        const z = cz + oz;
        if (!pointInCityHub(x, z, hub)) continue;
        if (nearHubStreetGrid(x, z, hub)) continue;

        const groundY = spec.flat ? hash2(x, z) * 1.2 : hillOffsetM(x, z);
        const footprint =
          spec.footprintMin + hash2(x, z) * (spec.footprintMax - spec.footprintMin);
        const height =
          (spec.heightMin + hash2(z, x) * (spec.heightMax - spec.heightMin)) * spec.heightMul;
        const matIndex = Math.floor(hash2(x + height, z) * BAY_WINDOW_LIGHTS.length);

        const tower = new Entity(`${hub.id}-${Math.round(x)}-${Math.round(z)}`);
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

  for (const hub of CITY_HUBS) {
    buildHubDistrict(app, hub, DISTRICTS[hub.district], materials);
  }

  const signed = new Set<DistrictId>();
  for (const hub of CITY_HUBS) {
    if (signed.has(hub.district)) continue;
    signed.add(hub.district);
    addDistrictSign(app, DISTRICTS[hub.district], hub.centerX, hub.centerZ);
  }
}

export function buildFreewayLamps(app: AppBase, spacing: number, limit: number): void {
  let count = 0;
  for (const route of FREEWAY_ROUTES) {
    for (let i = 0; i < route.length - 1 && count < limit; i++) {
      const a = route[i]!;
      const b = route[i + 1]!;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      if (len < 1) continue;
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
}
