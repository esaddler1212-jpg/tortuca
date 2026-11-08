import { Color, Entity, StandardMaterial, type AppBase } from 'playcanvas';

import { BAY_BRIDGE_ORANGE, BAY_WATER_DEEP, BAY_WATER_GLOW } from './night-palette';
import { BAY_WATER_CENTER_Z, BAY_WATER_DEPTH_M, WORLD_HALF_M } from './world-config';

function bridgeMaterial(orange: boolean): StandardMaterial {
  const mat = new StandardMaterial();
  if (orange) {
    mat.diffuse = BAY_BRIDGE_ORANGE;
    mat.emissive = BAY_BRIDGE_ORANGE;
    mat.emissiveIntensity = 0.35;
  } else {
    mat.diffuse = new Color(0.18, 0.2, 0.22);
    mat.metalness = 0.35;
    mat.gloss = 0.4;
  }
  mat.update();
  return mat;
}

/** San Francisco Bay water plane (east). */
export function buildBayWater(app: AppBase): void {
  const water = new StandardMaterial();
  water.diffuse = BAY_WATER_DEEP;
  water.emissive = BAY_WATER_GLOW;
  water.emissiveIntensity = 0.2;
  water.gloss = 0.85;
  water.metalness = 0.05;
  water.update();

  const bay = new Entity('sf-bay');
  bay.setLocalScale(WORLD_HALF_M * 2.2, 0.08, BAY_WATER_DEPTH_M);
  bay.setPosition(0, -0.05, BAY_WATER_CENTER_Z);
  bay.addComponent('render', { type: 'box', material: water });
  app.root.addChild(bay);
}

/** Low-poly Golden Gate–inspired span (west), Bay Bridge–style east span over water. */
export function buildBayBridges(app: AppBase): void {
  const orange = bridgeMaterial(true);
  const steel = bridgeMaterial(false);

  const gateZ = -520;
  const deck = new Entity('golden-gate-deck');
  deck.setLocalScale(320, 4, 12);
  deck.setPosition(0, 38, gateZ);
  deck.addComponent('render', { type: 'box', material: orange });
  app.root.addChild(deck);

  for (const sx of [-155, 155]) {
    const tower = new Entity(`gate-tower-${sx}`);
    tower.setLocalScale(8, 98, 8);
    tower.setPosition(sx, 49, gateZ);
    tower.addComponent('render', { type: 'box', material: orange });
    app.root.addChild(tower);
  }

  const cables = new Entity('gate-cables');
  cables.setLocalScale(300, 1.2, 1.2);
  cables.setPosition(0, 78, gateZ - 6);
  cables.addComponent('render', { type: 'box', material: orange });
  app.root.addChild(cables);

  const bayBridgeZ = 720;
  const bayDeck = new Entity('bay-bridge-deck');
  bayDeck.setLocalScale(480, 3.5, 14);
  bayDeck.setPosition(40, 26, bayBridgeZ);
  bayDeck.addComponent('render', { type: 'box', material: steel });
  app.root.addChild(bayDeck);

  for (const tx of [-180, -60, 80, 200]) {
    const pier = new Entity(`bay-pier-${tx}`);
    pier.setLocalScale(7, 32, 7);
    pier.setPosition(tx, 16, bayBridgeZ);
    pier.addComponent('render', { type: 'box', material: steel });
    app.root.addChild(pier);
  }

  const accent = new Entity('bay-bridge-accent');
  accent.setLocalScale(480, 0.8, 2);
  accent.setPosition(40, 28.5, bayBridgeZ);
  accent.addComponent('render', { type: 'box', material: orange });
  app.root.addChild(accent);
}
