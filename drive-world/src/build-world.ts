import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { STRIPE_SPACING_M, WORLD_HALF_M } from './world-config';

type WorldAssets = {
  asphalt: StandardMaterial;
  stripe: StandardMaterial;
  highway: StandardMaterial;
};

function materials(): WorldAssets {
  const asphalt = new StandardMaterial();
  asphalt.diffuse = new Color(0.11, 0.12, 0.14);
  asphalt.gloss = 0.22;
  asphalt.update();

  const highway = new StandardMaterial();
  highway.diffuse = new Color(0.14, 0.15, 0.17);
  highway.gloss = 0.28;
  highway.update();

  const stripe = new StandardMaterial();
  stripe.diffuse = new Color(0.93, 0.91, 0.84);
  stripe.emissive = new Color(0.06, 0.06, 0.05);
  stripe.update();

  return { asphalt, stripe, highway };
}

export function buildDrivingWorld(app: AppBase): WorldAssets {
  const mats = materials();
  const h = WORLD_HALF_M;

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

  for (let z = -h + STRIPE_SPACING_M; z < h; z += STRIPE_SPACING_M) {
    const mark = new Entity(`ns-stripe-${z}`);
    mark.setLocalScale(0.35, 0.02, 3.5);
    mark.setPosition(0, 0.03, z);
    mark.addComponent('render', { type: 'box', material: mats.stripe });
    app.root.addChild(mark);
  }

  for (let x = -h + STRIPE_SPACING_M; x < h; x += STRIPE_SPACING_M) {
    const mark = new Entity(`ew-stripe-${x}`);
    mark.setLocalScale(3.5, 0.02, 0.35);
    mark.setPosition(x, 0.03, 0);
    mark.addComponent('render', { type: 'box', material: mats.stripe });
    app.root.addChild(mark);
  }

  return mats;
}
