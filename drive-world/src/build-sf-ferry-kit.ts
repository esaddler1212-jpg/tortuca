import { Color, Entity, Vec3, type AppBase } from 'playcanvas';

import { kitMaterial } from './art-kit-materials';
import { hillOffsetM } from './bay-terrain';
import { BAY_BRIDGE_ORANGE, BAY_WINDOW_LIGHTS, hash2 } from './night-palette';
import { streetDeckY } from './street-utils';

/** Ferry Building landmark — art slice 2 (Embarcadero night read). */
export const SF_FERRY_POINT = { x: -780, z: -520 } as const;

/**
 * SF Embarcadero kit: Ferry clock tower silhouette, plaza decks with collision, pier lights.
 */
export function buildSfFerryKit(app: AppBase): void {
  const root = new Entity('sf-ferry-kit');
  app.root.addChild(root);

  const fx = SF_FERRY_POINT.x;
  const fz = SF_FERRY_POINT.z;
  const baseY = streetDeckY(fx, fz);
  const sy = hillOffsetM(fx, fz);

  const plaza = new Entity('sf-ferry-plaza');
  plaza.setPosition(fx, baseY, fz - 18);
  plaza.setLocalScale(76, 0.22, 58);
  plaza.addComponent('render', {
    type: 'box',
    material: kitMaterial(new Color(0.06, 0.06, 0.07), 0.06)
  });
  plaza.addComponent('collision', {
    type: 'box',
    halfExtents: new Vec3(38, 0.11, 29)
  });
  plaza.addComponent('rigidbody', { type: 'static' });
  root.addChild(plaza);

  const pier = new Entity('sf-ferry-pier-deck');
  pier.setPosition(fx, baseY, fz - 52);
  pier.setLocalScale(34, 0.2, 42);
  pier.addComponent('render', {
    type: 'box',
    material: kitMaterial(new Color(0.08, 0.07, 0.06), 0.1)
  });
  pier.addComponent('collision', {
    type: 'box',
    halfExtents: new Vec3(17, 0.1, 21)
  });
  pier.addComponent('rigidbody', { type: 'static' });
  root.addChild(pier);

  const tower = new Entity('sf-ferry-clock-tower');
  tower.setPosition(fx, baseY + 26, fz + 6);
  tower.setLocalScale(11, 52, 11);
  tower.addComponent('render', {
    type: 'box',
    material: kitMaterial(new Color(0.2, 0.18, 0.16), 0.18)
  });
  root.addChild(tower);

  const clockFace = new Entity('sf-ferry-clock-face');
  clockFace.setPosition(fx, baseY + 32, fz - 0.5);
  clockFace.setLocalScale(8, 8, 0.4);
  clockFace.addComponent('render', {
    type: 'box',
    material: kitMaterial(BAY_BRIDGE_ORANGE, 0.95)
  });
  root.addChild(clockFace);

  const wingL = new Entity('sf-ferry-wing-l');
  wingL.setPosition(fx - 22, baseY + 6, fz + 2);
  wingL.setLocalScale(28, 12, 18);
  wingL.addComponent('render', { type: 'box', material: kitMaterial(new Color(0.14, 0.13, 0.12), 0.12) });
  root.addChild(wingL);

  const wingR = new Entity('sf-ferry-wing-r');
  wingR.setPosition(fx + 22, baseY + 6, fz + 2);
  wingR.setLocalScale(28, 12, 18);
  wingR.addComponent('render', { type: 'box', material: kitMaterial(new Color(0.14, 0.13, 0.12), 0.12) });
  root.addChild(wingR);

  for (let i = 0; i < 6; i++) {
    const along = -28 + i * 11;
    const awning = new Entity(`sf-ferry-awning-${i}`);
    awning.setPosition(fx + along, baseY + 4.2, fz - 22);
    awning.setLocalScale(9, 0.35, 3.5);
    const c = BAY_WINDOW_LIGHTS[i % BAY_WINDOW_LIGHTS.length]!;
    awning.addComponent('render', { type: 'box', material: kitMaterial(c, 0.7) });
    root.addChild(awning);
  }

  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const px = fx - 36 + t * 72;
    const pz = fz - 18 + Math.sin(t * Math.PI) * 4;
    const bulb = new Entity(`sf-ferry-string-${i}`);
    bulb.setPosition(px, baseY + 5.5 + hash2(px, pz) * 0.4, pz);
    bulb.setLocalScale(0.35, 0.35, 0.35);
    bulb.addComponent('render', {
      type: 'box',
      material: kitMaterial(new Color(1, 0.92, 0.72), 0.85)
    });
    root.addChild(bulb);
  }

  const rim = new Entity('sf-ferry-plaza-light');
  rim.setPosition(fx, sy + 28, fz - 10);
  rim.addComponent('light', {
    type: 'point',
    color: new Color(0.9, 0.72, 0.45),
    intensity: 2.4,
    range: 110,
    castShadows: false
  });
  root.addChild(rim);
}