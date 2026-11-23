import { Color, Entity, Vec3, type AppBase } from 'playcanvas';

import { kitMaterial } from './art-kit-materials';
import { hillOffsetM } from './bay-terrain';
import { VALLEJO_SAFEHOUSE } from './landmark-registry';
import { BAY_BRIDGE_ORANGE, BAY_WINDOW_LIGHTS, hash2 } from './night-palette';
import { streetDeckY } from './street-utils';

/**
 * Vallejo estate art slice: driveway physics, pump islands, palms — matches night-palette.
 * Procedural only so CI needs no Kenney city install.
 */
export function buildVallejoEstateKit(app: AppBase): void {
  const root = new Entity('vallejo-estate-kit');
  app.root.addChild(root);

  const sx = VALLEJO_SAFEHOUSE.x;
  const sz = VALLEJO_SAFEHOUSE.z;
  const sy = hillOffsetM(sx, sz);

  const drivewayY = streetDeckY(sx, sz + 18);
  const driveway = new Entity('vallejo-estate-driveway');
  driveway.setPosition(sx, drivewayY, sz + 22);
  driveway.setLocalScale(34, 0.22, 52);
  const asphalt = kitMaterial(new Color(0.05, 0.06, 0.07), 0.08);
  driveway.addComponent('render', { type: 'box', material: asphalt });
  driveway.addComponent('collision', {
    type: 'box',
    halfExtents: new Vec3(17, 0.11, 26)
  });
  driveway.addComponent('rigidbody', { type: 'static' });
  root.addChild(driveway);

  const padLine = new Entity('vallejo-estate-pad-mark');
  padLine.setPosition(sx, drivewayY + 0.08, sz + 14);
  padLine.setLocalScale(12, 0.04, 1.2);
  const lineMat = kitMaterial(new Color(0.25, 0.75, 0.35), 0.75);
  padLine.addComponent('render', { type: 'box', material: lineMat });
  root.addChild(padLine);

  for (const [ox, oz, label] of [
    [-11, 8, 'pump-l'],
    [11, 8, 'pump-r']
  ] as const) {
    const baseY = streetDeckY(sx + ox, sz + oz);
    const island = new Entity(`vallejo-${label}-island`);
    island.setPosition(sx + ox, baseY + 0.35, sz + oz);
    island.setLocalScale(5.5, 0.7, 4.2);
    island.addComponent('render', { type: 'box', material: kitMaterial(new Color(0.12, 0.12, 0.14), 0.12) });
    root.addChild(island);

    const canopy = new Entity(`vallejo-${label}-canopy`);
    canopy.setPosition(sx + ox, baseY + 3.2, sz + oz);
    canopy.setLocalScale(6.2, 0.25, 5);
    canopy.addComponent('render', { type: 'box', material: kitMaterial(BAY_BRIDGE_ORANGE, 0.85) });
    root.addChild(canopy);

    const pump = new Entity(`vallejo-${label}-pump`);
    pump.setPosition(sx + ox, baseY + 1.4, sz + oz);
    pump.setLocalScale(0.9, 2.4, 0.9);
    const win = BAY_WINDOW_LIGHTS[Math.floor(hash2(ox, oz) * BAY_WINDOW_LIGHTS.length)]!;
    pump.addComponent('render', { type: 'box', material: kitMaterial(win, 0.4) });
    root.addChild(pump);
  }

  for (let i = 0; i < 5; i++) {
    const angle = -0.35 + i * 0.22;
    const dist = 38 + i * 2.5;
    const px = sx + Math.sin(angle) * dist;
    const pz = sz + Math.cos(angle) * dist + 6;
    const py = streetDeckY(px, pz);
    const trunk = new Entity(`vallejo-palm-${i}`);
    trunk.setPosition(px, py + 2.5, pz);
    trunk.setLocalScale(0.45, 5, 0.45);
    trunk.addComponent('render', { type: 'box', material: kitMaterial(new Color(0.08, 0.14, 0.1), 0.15) });
    root.addChild(trunk);
    const frond = new Entity(`vallejo-palm-top-${i}`);
    frond.setPosition(px, py + 5.4, pz);
    frond.setLocalScale(2.8, 0.35, 2.8);
    frond.addComponent('render', { type: 'box', material: kitMaterial(new Color(0.05, 0.22, 0.12), 0.25) });
    root.addChild(frond);
  }

  const rim = new Entity('vallejo-estate-rim-light');
  rim.setPosition(sx, sy + 16, sz - 8);
  rim.addComponent('light', {
    type: 'point',
    color: new Color(1, 0.5, 0.28),
    intensity: 2.2,
    range: 72,
    castShadows: false
  });
  root.addChild(rim);
}