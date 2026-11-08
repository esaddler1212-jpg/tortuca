import { Color, Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { hash2, NEON_ACCENTS } from './night-palette';
import { CITY_BLOCK_M, CITY_HALF_M, HIGHWAY_HALF_WIDTH_M } from './world-config';

const BUILDING_BASE = new Color(0.07, 0.075, 0.1);

function onHighwayCorridor(x: number, z: number): boolean {
  return Math.abs(x) < HIGHWAY_HALF_WIDTH_M + 8 || Math.abs(z) < HIGHWAY_HALF_WIDTH_M + 8;
}

function buildingMaterial(index: number): StandardMaterial {
  const accent = NEON_ACCENTS[index % NEON_ACCENTS.length];
  const mat = new StandardMaterial();
  mat.diffuse = BUILDING_BASE;
  mat.emissive = accent;
  mat.emissiveIntensity = 0.85;
  mat.gloss = 0.15;
  mat.metalness = 0.05;
  mat.update();
  return mat;
}

export function buildLowPolyNightCity(app: AppBase): void {
  const materialCache: StandardMaterial[] = NEON_ACCENTS.map((_, i) => buildingMaterial(i));

  for (let bx = -CITY_HALF_M; bx < CITY_HALF_M; bx += CITY_BLOCK_M) {
    for (let bz = -CITY_HALF_M; bz < CITY_HALF_M; bz += CITY_BLOCK_M) {
      const cx = bx + CITY_BLOCK_M * 0.5;
      const cz = bz + CITY_BLOCK_M * 0.5;
      if (onHighwayCorridor(cx, cz)) continue;

      const roll = hash2(cx, cz);
      if (roll < 0.12) continue;

      const towers = roll > 0.72 ? 2 : 1;
      for (let t = 0; t < towers; t++) {
        const ox = (hash2(cx + t, cz) - 0.5) * 22;
        const oz = (hash2(cz + t, cx) - 0.5) * 22;
        const x = cx + ox;
        const z = cz + oz;

        const footprint = 14 + hash2(x, z) * 22;
        const height = 12 + hash2(z, x) * 48;
        const matIndex = Math.floor(hash2(x + height, z) * NEON_ACCENTS.length);

        const tower = new Entity(`bld-${Math.round(x)}-${Math.round(z)}-${t}`);
        tower.setLocalScale(footprint, height, footprint);
        tower.setPosition(x, height * 0.5, z);
        tower.addComponent('render', { type: 'box', material: materialCache[matIndex] });
        tower.addComponent('collision', {
          type: 'box',
          halfExtents: new Vec3(footprint / 2, height / 2, footprint / 2)
        });
        tower.addComponent('rigidbody', { type: 'static' });
        app.root.addChild(tower);
      }
    }
  }
}

const LAMP_MAT = (() => {
  const m = new StandardMaterial();
  m.emissive = new Color(1, 0.92, 0.72);
  m.emissiveIntensity = 2;
  m.diffuse = new Color(0.1, 0.1, 0.12);
  m.update();
  return m;
})();

export function buildStreetLamps(app: AppBase, spacing: number, limit: number): void {
  let count = 0;
  const addLamp = (x: number, z: number) => {
    if (count >= limit) return;
    count++;

    const pole = new Entity(`lamp-${count}`);
    pole.setLocalScale(0.35, 5.5, 0.35);
    pole.setPosition(x, 2.75, z);
    pole.addComponent('render', { type: 'box', material: LAMP_MAT });
    app.root.addChild(pole);

    const bulb = new Entity(`lamp-light-${count}`);
    bulb.setPosition(x, 5.2, z);
    bulb.addComponent('light', {
      type: 'point',
      color: new Color(1, 0.85, 0.65),
      intensity: 1.6,
      range: 38,
      castShadows: false
    });
    app.root.addChild(bulb);
  };

  const hw = HIGHWAY_HALF_WIDTH_M + 5;
  for (let d = -CITY_HALF_M; d <= CITY_HALF_M && count < limit; d += spacing) {
    addLamp(hw, d);
    addLamp(-hw, d);
    addLamp(d, hw);
    addLamp(d, -hw);
  }
}
