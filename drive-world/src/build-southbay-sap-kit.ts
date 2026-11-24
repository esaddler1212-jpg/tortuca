import { Color, Entity, Vec3, type AppBase } from 'playcanvas';

import { kitDeckMaterial, kitFacadeMaterial, kitMaterial } from './art-kit-materials';
import { hillOffsetM } from './bay-terrain';
import { BAY_WINDOW_LIGHTS, hash2 } from './night-palette';
import { streetDeckY } from './street-utils';

/** South Bay SAP Center plaza — art slice 6. */
export const SOUTH_BAY_SAP = { x: 400, z: -1220 } as const;

/**
 * Arena kit: event plaza deck (collision), ring façade, marquee, light towers.
 */
export function buildSouthbaySapKit(app: AppBase): void {
  const root = new Entity('southbay-sap-kit');
  app.root.addChild(root);

  const sx = SOUTH_BAY_SAP.x;
  const sz = SOUTH_BAY_SAP.z;
  const baseY = streetDeckY(sx, sz);
  const sy = hillOffsetM(sx, sz);

  const plaza = new Entity('southbay-sap-plaza');
  plaza.setPosition(sx, baseY, sz);
  plaza.setLocalScale(58, 0.22, 48);
  plaza.setEulerAngles(0, 4, 0);
  plaza.addComponent('render', {
    type: 'box',
    material: kitDeckMaterial(new Color(0.06, 0.06, 0.07), 0.07)
  });
  plaza.addComponent('collision', {
    type: 'box',
    halfExtents: new Vec3(29, 0.11, 24)
  });
  plaza.addComponent('rigidbody', { type: 'static' });
  root.addChild(plaza);

  const ring = new Entity('southbay-sap-arena-ring');
  ring.setPosition(sx, baseY + 8, sz - 8);
  ring.setLocalScale(44, 16, 36);
  ring.addComponent('render', {
    type: 'box',
    material: kitFacadeMaterial(new Color(0.55, 0.42, 0.2), 0.38, new Color(0.08, 0.08, 0.09))
  });
  root.addChild(ring);

  const marquee = new Entity('southbay-sap-marquee');
  marquee.setPosition(sx, baseY + 12, sz + 28);
  marquee.setLocalScale(28, 3.5, 0.6);
  marquee.addComponent('render', {
    type: 'box',
    material: kitMaterial(new Color(0.2, 0.65, 0.95), 0.78)
  });
  root.addChild(marquee);

  for (let i = 0; i < 4; i++) {
    const ox = (i % 2 === 0 ? -1 : 1) * 26;
    const oz = i < 2 ? 18 : -22;
    const tower = new Entity(`southbay-sap-tower-${i}`);
    tower.setPosition(sx + ox, baseY + 14, sz + oz);
    tower.setLocalScale(4, 28, 4);
    tower.addComponent('render', {
      type: 'box',
      material: kitFacadeMaterial(BAY_WINDOW_LIGHTS[i % BAY_WINDOW_LIGHTS.length]!, 0.55)
    });
    root.addChild(tower);
  }

  for (let i = 0; i < 10; i++) {
    const along = -24 + (i % 5) * 12;
    const row = i < 5 ? 20 : 24;
    const bulb = new Entity(`southbay-sap-light-${i}`);
    bulb.setPosition(sx + along, baseY + 5 + hash2(i, sx) * 0.4, sz + row);
    bulb.setLocalScale(0.45, 0.45, 0.45);
    const c = BAY_WINDOW_LIGHTS[(i + 2) % BAY_WINDOW_LIGHTS.length]!;
    bulb.addComponent('render', { type: 'box', material: kitMaterial(c, 0.82) });
    root.addChild(bulb);
  }

  const rim = new Entity('southbay-sap-rim-light');
  rim.setPosition(sx, sy + 16, sz);
  rim.addComponent('light', {
    type: 'point',
    color: new Color(0.35, 0.7, 0.95),
    intensity: 2.2,
    range: 90,
    castShadows: false
  });
  root.addChild(rim);
}