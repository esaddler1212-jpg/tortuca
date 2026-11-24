import { Color, Entity, Vec3, type AppBase } from 'playcanvas';

import { kitDeckMaterial, kitMaterial } from './art-kit-materials';
import { hillOffsetM } from './bay-terrain';
import { BAY_WATER_GLOW, BAY_WINDOW_LIGHTS, hash2 } from './night-palette';
import { streetDeckY } from './street-utils';

/** Lake Merritt lakeside — art slice 4 (East Bay night read). */
export const EAST_BAY_LAKE = { x: 620, z: -120 } as const;

/**
 * East Bay kit: Merritt promenade deck (collision), lake ring glow, bench + string lights.
 */
export function buildEastbayLakeKit(app: AppBase): void {
  const root = new Entity('eastbay-lake-kit');
  app.root.addChild(root);

  const lx = EAST_BAY_LAKE.x;
  const lz = EAST_BAY_LAKE.z;
  const baseY = streetDeckY(lx, lz);
  const sy = hillOffsetM(lx, lz);

  const promenade = new Entity('eastbay-lake-promenade');
  promenade.setPosition(lx, baseY, lz + 22);
  promenade.setLocalScale(64, 0.22, 22);
  promenade.setEulerAngles(0, -6, 0);
  promenade.addComponent('render', {
    type: 'box',
    material: kitDeckMaterial(new Color(0.06, 0.06, 0.07), 0.07)
  });
  promenade.addComponent('collision', {
    type: 'box',
    halfExtents: new Vec3(32, 0.11, 11)
  });
  promenade.addComponent('rigidbody', { type: 'static' });
  root.addChild(promenade);

  const lakeRing = new Entity('eastbay-lake-ring');
  lakeRing.setPosition(lx, baseY - 0.15, lz - 28);
  lakeRing.setLocalScale(52, 0.12, 38);
  lakeRing.addComponent('render', {
    type: 'box',
    material: kitMaterial(BAY_WATER_GLOW, 0.45, new Color(0.02, 0.06, 0.1))
  });
  root.addChild(lakeRing);

  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const px = lx - 28 + t * 56;
    const bench = new Entity(`eastbay-lake-bench-${i}`);
    bench.setPosition(px, baseY + 0.55, lz + 16);
    bench.setLocalScale(3.2, 0.5, 1.2);
    bench.addComponent('render', {
      type: 'box',
      material: kitMaterial(new Color(0.14, 0.12, 0.11), 0.12)
    });
    root.addChild(bench);
  }

  for (let i = 0; i < 12; i++) {
    const along = -30 + (i % 6) * 12;
    const side = i < 6 ? 20 : 24;
    const bulb = new Entity(`eastbay-lake-light-${i}`);
    bulb.setPosition(lx + along, baseY + 4.2 + hash2(i, along) * 0.3, lz + side);
    bulb.setLocalScale(0.4, 0.4, 0.4);
    const c = BAY_WINDOW_LIGHTS[i % BAY_WINDOW_LIGHTS.length]!;
    bulb.addComponent('render', { type: 'box', material: kitMaterial(c, 0.8) });
    root.addChild(bulb);
  }

  const sign = new Entity('eastbay-lake-sign');
  sign.setPosition(lx, baseY + 5.5, lz + 30);
  sign.setLocalScale(16, 2.8, 0.4);
  sign.addComponent('render', {
    type: 'box',
    material: kitMaterial(new Color(0.22, 0.48, 0.58), 0.72)
  });
  root.addChild(sign);

  const rim = new Entity('eastbay-lake-rim-light');
  rim.setPosition(lx, sy + 14, lz);
  rim.addComponent('light', {
    type: 'point',
    color: new Color(0.45, 0.75, 0.9),
    intensity: 2.1,
    range: 88,
    castShadows: false
  });
  root.addChild(rim);
}