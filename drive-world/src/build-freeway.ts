import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { BAY_BRIDGE_ORANGE } from './night-palette';
import { FREEWAY_I80, FREEWAY_ROUTES, FREEWAY_WIDTH_M, STRIPE_SPACING_M, type FreewayWaypoint } from './world-config';

export type FreewayMaterials = {
  deck: StandardMaterial;
  stripe: StandardMaterial;
};

export function freewayMaterials(): FreewayMaterials {
  const deck = new StandardMaterial();
  deck.diffuse = new Color(0.06, 0.06, 0.07);
  deck.gloss = 0.7;
  deck.metalness = 0.15;
  deck.update();

  const stripe = new StandardMaterial();
  stripe.diffuse = new Color(0.85, 0.72, 0.2);
  stripe.emissive = new Color(0.32, 0.26, 0.06);
  stripe.emissiveIntensity = 0.45;
  stripe.update();

  return { deck, stripe };
}

function addDeckSegment(
  app: AppBase,
  ax: number,
  az: number,
  ay: number,
  bx: number,
  bz: number,
  by: number,
  mats: FreewayMaterials,
  elevated: boolean,
  tag: string
) {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz);
  if (len < 1) return;

  const mx = (ax + bx) * 0.5;
  const mz = (az + bz) * 0.5;
  const my = (ay + by) * 0.5 + 0.15;
  const angleDeg = (Math.atan2(dx, dz) * 180) / Math.PI;

  let deckMat = mats.deck;
  if (elevated) {
    const m = new StandardMaterial();
    m.diffuse = mats.deck.diffuse;
    m.gloss = 0.75;
    m.metalness = 0.2;
    m.emissive = BAY_BRIDGE_ORANGE;
    m.emissiveIntensity = 0.08;
    m.update();
    deckMat = m;
  }

  const road = new Entity(`${tag}-${Math.round(mx)}-${Math.round(mz)}`);
  road.setLocalScale(FREEWAY_WIDTH_M, 0.32, len + 0.5);
  road.setPosition(mx, my, mz);
  road.setEulerAngles(0, angleDeg, 0);
  road.addComponent('render', { type: 'box', material: deckMat });
  road.addComponent('collision', {
    type: 'box',
    halfExtents: new Vec3(FREEWAY_WIDTH_M / 2, 0.16, len / 2)
  });
  road.addComponent('rigidbody', { type: 'static' });
  app.root.addChild(road);

  const stripes = Math.max(1, Math.floor(len / STRIPE_SPACING_M));
  for (let i = 0; i < stripes; i += 2) {
    const t = (i + 0.5) / stripes - 0.5;
    const ox = Math.sin((angleDeg * Math.PI) / 180) * t * len;
    const oz = Math.cos((angleDeg * Math.PI) / 180) * t * len;
    const mark = new Entity(`${tag}-stripe-${Math.round(mx)}-${i}`);
    mark.setLocalScale(0.4, 0.03, 3.2);
    mark.setPosition(mx + ox, my + 0.08, mz + oz);
    mark.setEulerAngles(0, angleDeg, 0);
    mark.addComponent('render', { type: 'box', material: mats.stripe });
    app.root.addChild(mark);
  }
}

export function buildFreewayPath(app: AppBase, route: FreewayWaypoint[], mats: FreewayMaterials, tag: string): void {
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const ay = a.y ?? 0;
    const by = b.y ?? 0;
    const elevated = ay > 10 || by > 10;
    addDeckSegment(app, a.x, a.z, ay, b.x, b.z, by, mats, elevated, tag);
  }
}

export function buildAllFreeways(app: AppBase): FreewayMaterials {
  const mats = freewayMaterials();
  const tags = ['i80', 'us101', 'i880'];
  FREEWAY_ROUTES.forEach((route, i) => buildFreewayPath(app, route, mats, tags[i] ?? `fw${i}`));

  const bridgeMid = FREEWAY_I80[5];
  if (bridgeMid) {
    for (const tx of [-12, 12]) {
      const tower = new Entity(`bay-bridge-tower-${tx}`);
      tower.setLocalScale(6, 72, 6);
      tower.setPosition(bridgeMid.x + tx, (bridgeMid.y ?? 24) - 12, bridgeMid.z);
      const orange = new StandardMaterial();
      orange.diffuse = BAY_BRIDGE_ORANGE;
      orange.emissive = BAY_BRIDGE_ORANGE;
      orange.emissiveIntensity = 0.35;
      orange.update();
      tower.addComponent('render', { type: 'box', material: orange });
      app.root.addChild(tower);
    }
  }

  return mats;
}

/** @deprecated */
export function buildFreewayToVallejo(app: AppBase): FreewayMaterials {
  return buildAllFreeways(app);
}

export function nearestFreewayPoint(x: number, z: number): Vec3 {
  let best = new Vec3(FREEWAY_I80[0].x, FREEWAY_I80[0].y ?? 0, FREEWAY_I80[0].z);
  let bestD = Infinity;
  for (const route of FREEWAY_ROUTES) {
    for (const p of route) {
      const d = (p.x - x) ** 2 + (p.z - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = new Vec3(p.x, p.y ?? 0, p.z);
      }
    }
  }
  return best;
}
