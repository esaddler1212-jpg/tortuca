import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';
import { NAMED_STREETS } from './street-registry';
import {
  ARTERIAL_STREET_WIDTH_M,
  GRID_STREET_WIDTH_M,
  inBayWater,
  streetDeckY,
  tooCloseToFreeway
} from './street-utils';
import { DISTRICTS, type DistrictId, type DistrictSpec } from './world-config';

export type StreetMaterials = {
  asphalt: StandardMaterial;
  line: StandardMaterial;
  arterial: StandardMaterial;
};

function streetMaterials(): StreetMaterials {
  const asphalt = new StandardMaterial();
  asphalt.diffuse = new Color(0.08, 0.085, 0.09);
  asphalt.gloss = 0.55;
  asphalt.metalness = 0.08;
  asphalt.update();

  const arterial = new StandardMaterial();
  arterial.diffuse = new Color(0.1, 0.1, 0.11);
  arterial.gloss = 0.62;
  arterial.metalness = 0.1;
  arterial.emissive = new Color(0.04, 0.06, 0.08);
  arterial.emissiveIntensity = 0.12;
  arterial.update();

  const line = new StandardMaterial();
  line.diffuse = new Color(0.72, 0.68, 0.58);
  line.emissive = new Color(0.55, 0.5, 0.42);
  line.emissiveIntensity = 0.35;
  line.update();

  return { asphalt, line, arterial };
}

function segmentClear(ax: number, az: number, bx: number, bz: number): boolean {
  const mx = (ax + bx) * 0.5;
  const mz = (az + bz) * 0.5;
  if (inBayWater(mx, mz)) return false;
  if (tooCloseToFreeway(mx, mz, 14)) return false;
  return true;
}

function addStreetDeck(
  app: AppBase,
  ax: number,
  az: number,
  bx: number,
  bz: number,
  width: number,
  mats: StreetMaterials,
  tag: string,
  arterial: boolean
) {
  if (!segmentClear(ax, az, bx, bz)) return;

  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 3) return;

  const mx = (ax + bx) * 0.5;
  const mz = (az + bz) * 0.5;
  const my = streetDeckY(mx, mz);
  const angleDeg = (Math.atan2(dx, dz) * 180) / Math.PI;
  const deckMat = arterial ? mats.arterial : mats.asphalt;

  const road = new Entity(`${tag}-${Math.round(mx)}-${Math.round(mz)}`);
  road.setLocalScale(width, 0.22, len + 0.4);
  road.setPosition(mx, my, mz);
  road.setEulerAngles(0, angleDeg, 0);
  road.addComponent('render', { type: 'box', material: deckMat });
  road.addComponent('collision', {
    type: 'box',
    halfExtents: new Vec3(width / 2, 0.11, len / 2)
  });
  road.addComponent('rigidbody', { type: 'static' });
  app.root.addChild(road);

  const mark = new Entity(`${tag}-ctr-${Math.round(mx)}`);
  mark.setLocalScale(0.25, 0.02, Math.min(len * 0.4, 12));
  mark.setPosition(mx, my + 0.06, mz);
  mark.setEulerAngles(0, angleDeg, 0);
  mark.addComponent('render', { type: 'box', material: mats.line });
  app.root.addChild(mark);
}

function buildDistrictGrid(app: AppBase, spec: DistrictSpec, mats: StreetMaterials): void {
  const tag = `grid-${spec.id}`;
  for (let x = spec.minX; x <= spec.maxX; x += spec.blockM) {
    addStreetDeck(app, x, spec.minZ, x, spec.maxZ, GRID_STREET_WIDTH_M, mats, tag, false);
  }
  for (let z = spec.minZ; z <= spec.maxZ; z += spec.blockM) {
    addStreetDeck(app, spec.minX, z, spec.maxX, z, GRID_STREET_WIDTH_M, mats, tag, false);
  }
}

function buildNamedArterials(app: AppBase, mats: StreetMaterials): void {
  for (const street of NAMED_STREETS) {
    const w = street.width ?? ARTERIAL_STREET_WIDTH_M;
    for (let i = 0; i < street.points.length - 1; i++) {
      const a = street.points[i]!;
      const b = street.points[i + 1]!;
      addStreetDeck(app, a.x, a.z, b.x, b.z, w, mats, `arterial-${street.id}`, true);
    }
    const mid = street.points[Math.floor(street.points.length / 2)]!;
    const sy = hillOffsetM(mid.x, mid.z) + 0.2;
    const sign = new Entity(`street-sign-${street.id}`);
    sign.setLocalScale(0.25, 3.2, 1.2);
    sign.setPosition(mid.x, sy + 4, mid.z);
    const signMat = new StandardMaterial();
    signMat.emissive = new Color(0.35, 0.75, 0.95);
    signMat.emissiveIntensity = 0.65;
    signMat.update();
    sign.addComponent('render', { type: 'box', material: signMat });
    app.root.addChild(sign);
  }
}

function addSparseStreetLamps(app: AppBase, spec: DistrictSpec, limit: number): void {
  const lampMat = new StandardMaterial();
  lampMat.emissive = new Color(1, 0.84, 0.55);
  lampMat.emissiveIntensity = 1.2;
  lampMat.update();
  let n = 0;
  for (let x = spec.minX; x <= spec.maxX && n < limit; x += spec.blockM * 2) {
    for (let z = spec.minZ; z <= spec.maxZ && n < limit; z += spec.blockM * 2) {
      if (tooCloseToFreeway(x, z, 28)) continue;
      if (inBayWater(x, z)) continue;
      const y = hillOffsetM(x, z) + 0.2;
      const pole = new Entity(`st-lamp-${spec.id}-${n}`);
      pole.setLocalScale(0.28, 4.2, 0.28);
      pole.setPosition(x, y + 2.1, z);
      pole.addComponent('render', { type: 'box', material: lampMat });
      app.root.addChild(pole);
      n++;
    }
  }
}

export function buildCityStreets(app: AppBase): void {
  const mats = streetMaterials();
  (Object.keys(DISTRICTS) as DistrictId[]).forEach((id) => {
    buildDistrictGrid(app, DISTRICTS[id], mats);
    addSparseStreetLamps(app, DISTRICTS[id], 18);
  });
  buildNamedArterials(app, mats);
}
