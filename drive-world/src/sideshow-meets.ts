import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { hillOffsetM } from './bay-terrain';

export type SideshowSite = {
  id: string;
  name: string;
  x: number;
  z: number;
  headingDeg: number;
};

/** Lots that rotate as nightly sideshow meetups (homage to Bay car culture — ambient only). */
export const SIDESHOW_SITES: SideshowSite[] = [
  { id: 'oakland-lake', name: 'Lake Merritt meet', x: 655, z: -108, headingDeg: 35 },
  { id: 'emeryville', name: 'Emeryville lot', x: 608, z: -255, headingDeg: 90 },
  { id: 'vallejo-yard', name: 'Vallejo yard', x: 465, z: 955, headingDeg: 180 },
  { id: 'sf-pier', name: 'Pier 39 overflow', x: -708, z: -745, headingDeg: 200 },
  { id: 'san-jose-arena', name: 'SAP load-in', x: 418, z: -1235, headingDeg: 15 },
  { id: 'concord-plaza', name: 'Concord plaza', x: 1010, z: 88, headingDeg: 0 },
  { id: 'peninsula-lot', name: 'Dumbarton lot', x: -55, z: -655, headingDeg: 125 },
  { id: 'marin-view', name: 'Sausalito view', x: -1165, z: 298, headingDeg: 70 }
];

const ROTATE_SEC = 150;

type MeetRig = {
  siteId: string;
  root: Entity;
  lineup: Entity[];
  donuts: Entity[];
};

let rigs: MeetRig[] = [];
let lastActiveId: string | null = null;
let notifiedSiteId: string | null = null;

function carMat(hue: number): StandardMaterial {
  const m = new StandardMaterial();
  m.diffuse = new Color(0.08, 0.08, 0.1);
  m.emissive = new Color(hue, hue * 0.45, 1 - hue * 0.35);
  m.emissiveIntensity = 0.55;
  m.update();
  return m;
}

function spawnLineupCar(parent: Entity, x: number, z: number, heading: number, mat: StandardMaterial, scale = 1): Entity {
  const car = new Entity('lineup-car');
  car.setLocalScale(1.7 * scale, 0.5 * scale, 2.4 * scale);
  car.setLocalPosition(x, 0.35, z);
  car.setLocalEulerAngles(0, heading, 0);
  car.addComponent('render', { type: 'box', material: mat });
  parent.addChild(car);
  return car;
}

function buildSiteRig(app: AppBase, site: SideshowSite): MeetRig {
  const y = hillOffsetM(site.x, site.z);
  const root = new Entity(`sideshow-${site.id}`);
  root.setPosition(site.x, y, site.z);
  root.setEulerAngles(0, site.headingDeg, 0);
  root.enabled = false;

  const pad = new Entity('pad');
  pad.setLocalScale(48, 0.15, 32);
  pad.setLocalPosition(0, 0.05, 0);
  const padMat = new StandardMaterial();
  padMat.emissive = new Color(0.35, 0.2, 0.55);
  padMat.emissiveIntensity = 0.35;
  padMat.update();
  pad.addComponent('render', { type: 'box', material: padMat });
  root.addChild(pad);

  const lineup: Entity[] = [];
  const hues = [0.15, 0.55, 0.85, 0.32, 0.68, 0.42, 0.78];
  for (let i = 0; i < 7; i++) {
    lineup.push(spawnLineupCar(root, -16 + i * 5.2, -8, 0, carMat(hues[i] ?? 0.5)));
  }

  const donuts: Entity[] = [];
  for (const side of [-1, 1]) {
    const d = spawnLineupCar(root, side * 14, 6, 0, carMat(0.92), 0.95);
    donuts.push(d);
  }

  app.root.addChild(root);
  return { siteId: site.id, root, lineup, donuts };
}

export function buildSideshowMeets(app: AppBase): void {
  rigs = SIDESHOW_SITES.map((s) => buildSiteRig(app, s));
}

export function activeSideshowSite(worldTimeSec: number): SideshowSite {
  const idx = Math.floor(worldTimeSec / ROTATE_SEC) % SIDESHOW_SITES.length;
  return SIDESHOW_SITES[idx]!;
}

export function updateSideshowMeets(dt: number, worldTimeSec: number, enabled: boolean): SideshowSite | null {
  if (!enabled || rigs.length === 0) return null;
  const site = activeSideshowSite(worldTimeSec);
  if (site.id !== lastActiveId) {
    for (const rig of rigs) rig.root.enabled = rig.siteId === site.id;
    lastActiveId = site.id;
    notifiedSiteId = null;
  }
  const rig = rigs.find((r) => r.siteId === site.id);
  if (!rig) return site;
  for (const d of rig.donuts) {
    const e = d.getLocalEulerAngles();
    d.setLocalEulerAngles(0, e.y + 185 * dt, Math.sin(worldTimeSec * 4) * 4);
  }
  return site;
}

export function shouldNotifySideshow(px: number, pz: number, site: SideshowSite | null): boolean {
  if (!site) return false;
  if (notifiedSiteId === site.id) return false;
  const dist = Math.hypot(px - site.x, pz - site.z);
  if (dist > 95) return false;
  notifiedSiteId = site.id;
  return true;
}
