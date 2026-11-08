import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { buildBayWater } from './build-bay';
import { buildAllDistricts, buildFreewayLamps } from './build-districts';
import { buildFreewayToVallejo } from './build-freeway';
import { NIGHT_FOG } from './night-palette';
import { WORLD_HALF_M } from './world-config';

export function buildDrivingWorld(app: AppBase): void {
  app.scene.fog = NIGHT_FOG.clone();

  const groundMat = new StandardMaterial();
  groundMat.diffuse = new Color(0.04, 0.045, 0.05);
  groundMat.gloss = 0.2;
  groundMat.update();

  const h = WORLD_HALF_M;
  const ground = new Entity('ground');
  ground.setLocalScale(h * 2, 0.4, h * 2);
  ground.setPosition(0, -0.35, 0);
  ground.addComponent('render', { type: 'box', material: groundMat });
  ground.addComponent('collision', { type: 'box', halfExtents: new Vec3(h, 0.2, h) });
  ground.addComponent('rigidbody', { type: 'static' });
  app.root.addChild(ground);

  buildBayWater(app);
  buildFreewayToVallejo(app);
  buildAllDistricts(app);
  buildFreewayLamps(app, 85, 80);
}
