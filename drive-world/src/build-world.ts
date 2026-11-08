import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { buildBayBridges, buildBayWater } from './build-bay';
import { buildLowPolyNightCity, buildStreetLamps } from './build-city';
import { NIGHT_FOG } from './night-palette';
import { STRIPE_SPACING_M, WORLD_HALF_M } from './world-config';

type WorldAssets = {
  asphalt: StandardMaterial;
  stripe: StandardMaterial;
  highway: StandardMaterial;
};

function materials(): WorldAssets {
  const asphalt = new StandardMaterial();
  asphalt.diffuse = new Color(0.05, 0.05, 0.06);
  asphalt.gloss = 0.55;
  asphalt.metalness = 0.1;
  asphalt.update();

  const highway = new StandardMaterial();
  highway.diffuse = new Color(0.07, 0.07, 0.08);
  highway.gloss = 0.65;
  highway.metalness = 0.12;
  highway.update();

  const stripe = new StandardMaterial();
  stripe.diffuse = new Color(0.85, 0.72, 0.2);
  stripe.emissive = new Color(0.35, 0.28, 0.05);
  stripe.emissiveIntensity = 0.4;
  stripe.update();

  return { asphalt, stripe, highway };
}

export function buildDrivingWorld(app: AppBase): WorldAssets {
  const mats = materials();
  const h = WORLD_HALF_M;

  app.scene.fog = NIGHT_FOG.clone();

  const ground = new Entity('ground');
  ground.setLocalScale(h * 2, 0.4, h * 2);
  ground.setPosition(0, -0.2, 0);
  ground.addComponent('render', { type: 'box', material: mats.asphalt });
  ground.addComponent('collision', { type: 'box', halfExtents: new Vec3(h, 0.2, h) });
  ground.addComponent('rigidbody', { type: 'static' });
  app.root.addChild(ground);

  const northSouth = new Entity('highway-ns');
  northSouth.setLocalScale(42, 0.06, h * 2);
  northSouth.setPosition(0, 0.01, 0);
  northSouth.addComponent('render', { type: 'box', material: mats.highway });
  app.root.addChild(northSouth);

  const eastWest = new Entity('highway-ew');
  eastWest.setLocalScale(h * 2, 0.06, 42);
  eastWest.setPosition(0, 0.015, 0);
  eastWest.addComponent('render', { type: 'box', material: mats.highway });
  app.root.addChild(eastWest);

  const stripeExtent = Math.min(h, 1200);
  for (let z = -stripeExtent + STRIPE_SPACING_M; z < stripeExtent; z += STRIPE_SPACING_M) {
    const mark = new Entity(`ns-stripe-${z}`);
    mark.setLocalScale(0.35, 0.02, 3.5);
    mark.setPosition(0, 0.03, z);
    mark.addComponent('render', { type: 'box', material: mats.stripe });
    app.root.addChild(mark);
  }

  for (let x = -stripeExtent + STRIPE_SPACING_M; x < stripeExtent; x += STRIPE_SPACING_M) {
    const mark = new Entity(`ew-stripe-${x}`);
    mark.setLocalScale(3.5, 0.02, 0.35);
    mark.setPosition(x, 0.03, 0);
    mark.addComponent('render', { type: 'box', material: mats.stripe });
    app.root.addChild(mark);
  }

  buildBayWater(app);
  buildBayBridges(app);
  buildLowPolyNightCity(app);
  buildStreetLamps(app, 90, 96);

  return mats;
}
