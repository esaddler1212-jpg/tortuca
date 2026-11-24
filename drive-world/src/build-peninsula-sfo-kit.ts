import { Color, Entity, Vec3, type AppBase } from 'playcanvas';

import { kitDeckMaterial, kitFacadeMaterial, kitMaterial } from './art-kit-materials';
import { hillOffsetM } from './bay-terrain';
import { SFO_AIRPORT_LOT } from './landmark-registry';
import { BAY_BRIDGE_ORANGE, BAY_WINDOW_LIGHTS, hash2 } from './night-palette';
import { streetDeckY } from './street-utils';

/** Peninsula SFO flight gate — art slice 5. */
export const PENINSULA_SFO_GATE = {
  x: SFO_AIRPORT_LOT.x,
  z: SFO_AIRPORT_LOT.z
} as const;

/**
 * SFO lot art: departure deck (collision), tower silhouette, runway edge lights, Tokyo gate sign glow.
 */
export function buildPeninsulaSfoKit(app: AppBase): void {
  const root = new Entity('peninsula-sfo-kit');
  app.root.addChild(root);

  const gx = PENINSULA_SFO_GATE.x;
  const gz = PENINSULA_SFO_GATE.z;
  const baseY = streetDeckY(gx, gz);
  const sy = hillOffsetM(gx, gz);

  const lot = new Entity('peninsula-sfo-lot-deck');
  lot.setPosition(gx, baseY, gz);
  lot.setLocalScale(72, 0.22, 56);
  lot.setEulerAngles(0, -8, 0);
  lot.addComponent('render', {
    type: 'box',
    material: kitDeckMaterial(new Color(0.05, 0.06, 0.07), 0.08)
  });
  lot.addComponent('collision', {
    type: 'box',
    halfExtents: new Vec3(36, 0.11, 28)
  });
  lot.addComponent('rigidbody', { type: 'static' });
  root.addChild(lot);

  const taxi = new Entity('peninsula-sfo-taxi-strip');
  taxi.setPosition(gx + 42, baseY + 0.02, gz - 18);
  taxi.setLocalScale(48, 0.16, 14);
  taxi.setEulerAngles(0, 12, 0);
  taxi.addComponent('render', {
    type: 'box',
    material: kitMaterial(BAY_BRIDGE_ORANGE, 0.35, new Color(0.04, 0.05, 0.06))
  });
  root.addChild(taxi);

  const tower = new Entity('peninsula-sfo-tower');
  tower.setPosition(gx - 28, baseY + 11, gz - 22);
  tower.setLocalScale(8, 22, 8);
  tower.addComponent('render', {
    type: 'box',
    material: kitFacadeMaterial(new Color(0.12, 0.22, 0.38), 0.55)
  });
  root.addChild(tower);

  const gateSign = new Entity('peninsula-sfo-gate-sign');
  gateSign.setPosition(gx, baseY + 6.5, gz + 32);
  gateSign.setLocalScale(22, 3.2, 0.5);
  gateSign.addComponent('render', {
    type: 'box',
    material: kitMaterial(new Color(0.85, 0.42, 0.18), 0.82)
  });
  root.addChild(gateSign);

  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const lx = gx - 34 + t * 68;
    const pole = new Entity(`peninsula-sfo-edge-${i}`);
    pole.setPosition(lx, baseY + 2.2, gz - 26);
    pole.setLocalScale(0.35, 2.4, 0.35);
    const c = BAY_WINDOW_LIGHTS[i % BAY_WINDOW_LIGHTS.length]!;
    pole.addComponent('render', { type: 'box', material: kitMaterial(c, 0.75) });
    root.addChild(pole);
  }

  for (let i = 0; i < 6; i++) {
    const canopy = new Entity(`peninsula-sfo-canopy-${i}`);
    canopy.setPosition(gx - 20 + i * 8, baseY + 4.5, gz + 8);
    canopy.setLocalScale(6, 0.35, 5);
    canopy.addComponent('render', {
      type: 'box',
      material: kitMaterial(new Color(0.08, 0.09, 0.11), 0.1 + hash2(i, gx) * 0.08)
    });
    root.addChild(canopy);
  }

  const rim = new Entity('peninsula-sfo-rim-light');
  rim.setPosition(gx, sy + 18, gz);
  rim.addComponent('light', {
    type: 'point',
    color: new Color(0.75, 0.55, 0.35),
    intensity: 2.4,
    range: 95,
    castShadows: false
  });
  root.addChild(rim);
}