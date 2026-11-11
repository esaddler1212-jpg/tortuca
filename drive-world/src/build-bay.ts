import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { BAY_WATER_DEEP, BAY_WATER_GLOW } from './night-palette';
import { BAY_WATER_BOUNDS, WORLD_HALF_M } from './world-config';

/** San Francisco Bay between districts (under the bridge corridor). */
export function buildBayWater(app: AppBase): void {
  const water = new StandardMaterial();
  water.diffuse = BAY_WATER_DEEP;
  water.emissive = BAY_WATER_GLOW;
  water.emissiveIntensity = 0.2;
  water.gloss = 0.85;
  water.metalness = 0.05;
  water.update();

  const cx = (BAY_WATER_BOUNDS.minX + BAY_WATER_BOUNDS.maxX) * 0.5;
  const cz = BAY_WATER_BOUNDS.centerZ;
  const w = BAY_WATER_BOUNDS.maxX - BAY_WATER_BOUNDS.minX;
  const d = BAY_WATER_BOUNDS.depthZ;

  const bay = new Entity('sf-bay');
  bay.setLocalScale(w, 0.08, d);
  bay.setPosition(cx, -0.12, cz);
  bay.addComponent('render', { type: 'box', material: water });
  app.root.addChild(bay);

  const fringe = new Entity('bay-fringe');
  fringe.setLocalScale(WORLD_HALF_M * 2, 0.06, WORLD_HALF_M * 2);
  fringe.setPosition(0, -1.35, 0);
  const fringeMat = new StandardMaterial();
  fringeMat.diffuse = new Color(0.04, 0.05, 0.06);
  fringeMat.update();
  fringe.addComponent('render', { type: 'box', material: fringeMat });
  app.root.addChild(fringe);
}
