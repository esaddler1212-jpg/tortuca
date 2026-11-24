import { Color, Entity, Vec3, type AppBase } from 'playcanvas';

import { kitMaterial } from './art-kit-materials';
import { hillOffsetM } from './bay-terrain';
import { BAY_BRIDGE_ORANGE, hash2 } from './night-palette';
import { streetDeckY } from './street-utils';

/** Golden Gate south vista — art slice 3 (Marin approach night read). */
export const MARIN_GG_VISTA = { x: -1165, z: -455 } as const;

/**
 * Marin bridge approach: vista pull-off deck (collision), cable hints, orange beacons.
 * Complements `golden-gate` span in `build-landmarks.ts` without replacing it.
 */
export function buildMarinBridgeKit(app: AppBase): void {
  const root = new Entity('marin-bridge-kit');
  app.root.addChild(root);

  const vx = MARIN_GG_VISTA.x;
  const vz = MARIN_GG_VISTA.z;
  const baseY = streetDeckY(vx, vz);
  const sy = hillOffsetM(vx, vz);

  const vista = new Entity('marin-gg-vista-deck');
  vista.setPosition(vx, baseY, vz);
  vista.setLocalScale(48, 0.22, 38);
  vista.setEulerAngles(0, 18, 0);
  vista.addComponent('render', {
    type: 'box',
    material: kitMaterial(new Color(0.05, 0.06, 0.07), 0.08)
  });
  vista.addComponent('collision', {
    type: 'box',
    halfExtents: new Vec3(24, 0.11, 19)
  });
  vista.addComponent('rigidbody', { type: 'static' });
  root.addChild(vista);

  const stripe = new Entity('marin-gg-vista-stripe');
  stripe.setPosition(vx + 4, baseY + 0.08, vz - 8);
  stripe.setLocalScale(28, 0.04, 1.4);
  stripe.setEulerAngles(0, 18, 0);
  stripe.addComponent('render', {
    type: 'box',
    material: kitMaterial(BAY_BRIDGE_ORANGE, 0.88)
  });
  root.addChild(stripe);

  const sign = new Entity('marin-gg-vista-sign');
  sign.setPosition(vx, baseY + 4.5, vz + 14);
  sign.setLocalScale(18, 3.2, 0.5);
  sign.setEulerAngles(0, -8, 0);
  sign.addComponent('render', {
    type: 'box',
    material: kitMaterial(BAY_BRIDGE_ORANGE, 0.75, new Color(0.12, 0.1, 0.09))
  });
  root.addChild(sign);

  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const px = vx - 20 + t * 42;
    const pz = vz + 6 + Math.sin(t * Math.PI) * 5;
    const cable = new Entity(`marin-gg-cable-${i}`);
    cable.setPosition(px, baseY + 22 + hash2(px, pz) * 4, pz);
    cable.setLocalScale(0.35, 28, 0.35);
    cable.setEulerAngles(0, 14 + t * 6, 0);
    cable.addComponent('render', {
      type: 'box',
      material: kitMaterial(BAY_BRIDGE_ORANGE, 0.55)
    });
    root.addChild(cable);
  }

  for (const [ox, oz, h] of [
    [-22, -14, 9],
    [20, -12, 11],
    [0, 18, 7]
  ] as const) {
    const beacon = new Entity(`marin-gg-beacon-${ox}`);
    beacon.setPosition(vx + ox, baseY + h * 0.5, vz + oz);
    beacon.setLocalScale(1.2, h, 1.2);
    beacon.addComponent('render', {
      type: 'box',
      material: kitMaterial(BAY_BRIDGE_ORANGE, 0.35, new Color(0.1, 0.1, 0.11))
    });
    root.addChild(beacon);
    const lamp = new Entity(`marin-gg-beacon-lamp-${ox}`);
    lamp.setPosition(vx + ox, baseY + h + 0.8, vz + oz);
    lamp.setLocalScale(0.8, 0.8, 0.8);
    lamp.addComponent('render', {
      type: 'box',
      material: kitMaterial(new Color(1, 0.82, 0.62), 0.9)
    });
    root.addChild(lamp);
  }

  const rim = new Entity('marin-gg-vista-light');
  rim.setPosition(vx, sy + 24, vz - 6);
  rim.addComponent('light', {
    type: 'point',
    color: new Color(1, 0.45, 0.22),
    intensity: 2.6,
    range: 95,
    castShadows: false
  });
  root.addChild(rim);
}