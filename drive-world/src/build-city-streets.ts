import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import {
  CITY_HUBS,
  HUB_CONNECTORS,
  LANDMARK_STREET_ROUTES,
  pointInCityHub,
  pointsForLandmarks,
  type CityHub
} from './city-map-registry';
import { hillOffsetM } from './bay-terrain';
import { LANDMARKS } from './landmark-registry';
import { crossingForHub } from './street-name-registry';
import { NAMED_STREETS } from './street-registry';
import {
  ARTERIAL_STREET_WIDTH_M,
  GRID_STREET_WIDTH_M,
  inBayWater,
  streetDeckY,
  tooCloseToFreeway
} from './street-utils';

export type StreetMaterials = {
  asphalt: StandardMaterial;
  line: StandardMaterial;
  arterial: StandardMaterial;
  plaza: StandardMaterial;
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

  const plaza = new StandardMaterial();
  plaza.diffuse = new Color(0.14, 0.14, 0.16);
  plaza.gloss = 0.35;
  plaza.emissive = new Color(0.08, 0.1, 0.14);
  plaza.emissiveIntensity = 0.15;
  plaza.update();

  return { asphalt, line, arterial, plaza };
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

function clipSegmentToHub(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  hub: CityHub
): { ax: number; az: number; bx: number; bz: number } | null {
  const samples = 12;
  let first: { x: number; z: number } | null = null;
  let last: { x: number; z: number } | null = null;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    if (!pointInCityHub(x, z, hub)) continue;
    if (!first) first = { x, z };
    last = { x, z };
  }
  if (!first || !last) return null;
  return { ax: first.x, az: first.z, bx: last.x, bz: last.z };
}

function buildHubGrid(app: AppBase, hub: CityHub, mats: StreetMaterials): void {
  const blockM = hub.blockM ?? 52;
  const tag = `hub-${hub.id}`;
  const minX = hub.centerX - hub.radiusM;
  const maxX = hub.centerX + hub.radiusM;
  const minZ = hub.centerZ - hub.radiusM;
  const maxZ = hub.centerZ + hub.radiusM;

  for (let x = minX; x <= maxX; x += blockM) {
    const clipped = clipSegmentToHub(x, minZ, x, maxZ, hub);
    if (clipped) {
      addStreetDeck(app, clipped.ax, clipped.az, clipped.bx, clipped.bz, GRID_STREET_WIDTH_M, mats, tag, false);
    }
  }
  for (let z = minZ; z <= maxZ; z += blockM) {
    const clipped = clipSegmentToHub(minX, z, maxX, z, hub);
    if (clipped) {
      addStreetDeck(app, clipped.ax, clipped.az, clipped.bx, clipped.bz, GRID_STREET_WIDTH_M, mats, tag, false);
    }
  }
}

function buildPointRoute(
  app: AppBase,
  points: { x: number; z: number }[],
  width: number,
  tag: string,
  ring: boolean,
  mats: StreetMaterials
) {
  if (points.length < 2) return;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    addStreetDeck(app, a.x, a.z, b.x, b.z, width, mats, tag, true);
  }
  if (ring) {
    const a = points[points.length - 1]!;
    const b = points[0]!;
    addStreetDeck(app, a.x, a.z, b.x, b.z, width, mats, `${tag}-ring`, true);
  }
}

function buildLandmarkPlazas(app: AppBase, mats: StreetMaterials): void {
  for (const lm of LANDMARKS) {
    const hub = CITY_HUBS.find(
      (h) => h.district === lm.district && pointInCityHub(lm.x, lm.z, h)
    );
    if (!hub) continue;
    const y = hillOffsetM(lm.x, lm.z) + 0.08;
    const pad = new Entity(`plaza-${lm.id}`);
    const span = Math.min(48, lm.visitRadius * 1.1);
    pad.setLocalScale(span, 0.18, span);
    pad.setPosition(lm.x, y, lm.z);
    pad.addComponent('render', { type: 'box', material: mats.plaza });
    pad.addComponent('collision', {
      type: 'box',
      halfExtents: new Vec3(span / 2, 0.09, span / 2)
    });
    pad.addComponent('rigidbody', { type: 'static' });
    app.root.addChild(pad);
  }
}

function addHubLamps(app: AppBase, hub: CityHub, limit: number): void {
  const lampMat = new StandardMaterial();
  lampMat.emissive = new Color(1, 0.84, 0.55);
  lampMat.emissiveIntensity = 1.2;
  lampMat.update();
  const blockM = hub.blockM ?? 52;
  let n = 0;
  for (let x = hub.centerX - hub.radiusM; x <= hub.centerX + hub.radiusM && n < limit; x += blockM * 2) {
    for (let z = hub.centerZ - hub.radiusM; z <= hub.centerZ + hub.radiusM && n < limit; z += blockM * 2) {
      if (!pointInCityHub(x, z, hub)) continue;
      if (tooCloseToFreeway(x, z, 28)) continue;
      const y = hillOffsetM(x, z) + 0.2;
      const pole = new Entity(`hub-lamp-${hub.id}-${n}`);
      pole.setLocalScale(0.28, 4.2, 0.28);
      pole.setPosition(x, y + 2.1, z);
      pole.addComponent('render', { type: 'box', material: lampMat });
      app.root.addChild(pole);
      n++;
    }
  }
}

function addStreetNameSign(app: AppBase, x: number, z: number, label: string, alongZ: boolean): void {
  const y = streetDeckY(x, z);
  const poleMat = new StandardMaterial();
  poleMat.diffuse = new Color(0.12, 0.12, 0.14);
  poleMat.update();
  const bladeMat = new StandardMaterial();
  bladeMat.emissive = new Color(0.15, 0.42, 0.28);
  bladeMat.emissiveIntensity = 0.55;
  bladeMat.update();

  const pole = new Entity(`street-sign-pole-${label.replace(/\s+/g, '-')}-${Math.round(x)}`);
  pole.setLocalScale(0.2, 3.6, 0.2);
  pole.setPosition(x, y + 1.8, z);
  pole.addComponent('render', { type: 'box', material: poleMat });
  app.root.addChild(pole);

  const blade = new Entity(`street-sign-blade-${label.replace(/\s+/g, '-')}-${Math.round(x)}`);
  blade.setLocalScale(alongZ ? 0.15 : 2.8, 0.5, alongZ ? 2.8 : 0.15);
  blade.setPosition(x, y + 3.5, z);
  blade.addComponent('render', { type: 'box', material: bladeMat });
  app.root.addChild(blade);
}

function buildHubStreetSigns(app: AppBase): void {
  for (const hub of CITY_HUBS) {
    const cross = crossingForHub(hub.id);
    if (!cross) continue;
    addStreetNameSign(app, hub.centerX + 7, hub.centerZ, cross.eastWest, false);
    addStreetNameSign(app, hub.centerX, hub.centerZ + 7, cross.northSouth, true);
  }

  const signed = new Set<string>();
  for (const street of NAMED_STREETS) {
    if (signed.has(street.id)) continue;
    signed.add(street.id);
    const mid = street.points[Math.floor(street.points.length / 2)];
    if (!mid) continue;
    addStreetNameSign(app, mid.x, mid.z, street.label, Math.abs(street.points[0]!.x - street.points[1]!.x) < 8);
  }
}

export function buildCityStreets(app: AppBase): void {
  const mats = streetMaterials();

  for (const hub of CITY_HUBS) {
    buildHubGrid(app, hub, mats);
    addHubLamps(app, hub, 14);
  }

  for (const route of LANDMARK_STREET_ROUTES) {
    if (route.landmarkIds.length < 2) continue;
    const pts = pointsForLandmarks(route.landmarkIds);
    buildPointRoute(app, pts, route.width ?? ARTERIAL_STREET_WIDTH_M, `lm-route-${route.id}`, !!route.ring, mats);
  }

  for (const conn of HUB_CONNECTORS) {
    if (conn.points.length < 2) continue;
    buildPointRoute(app, conn.points, conn.width ?? 15, `hub-link-${conn.id}`, false, mats);
  }

  for (const street of NAMED_STREETS) {
    const w = street.width ?? ARTERIAL_STREET_WIDTH_M;
    buildPointRoute(app, street.points, w, `arterial-${street.id}`, false, mats);
  }

  buildLandmarkPlazas(app, mats);
  buildHubStreetSigns(app);
}
