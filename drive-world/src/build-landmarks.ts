import { Entity, StandardMaterial, Vec3, type AppBase } from 'playcanvas';

import { matConcrete, matGlass, matOrange, matStone, matWarmWindow } from './landmark-materials';

function box(
  app: AppBase,
  name: string,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  material: StandardMaterial,
  collider = false
): Entity {
  const e = new Entity(name);
  e.setLocalScale(sx, sy, sz);
  e.setPosition(x, y, z);
  e.addComponent('render', { type: 'box', material });
  if (collider) {
    e.addComponent('collision', { type: 'box', halfExtents: new Vec3(sx / 2, sy / 2, sz / 2) });
    e.addComponent('rigidbody', { type: 'static' });
  }
  app.root.addChild(e);
  return e;
}

function pyramid(
  app: AppBase,
  name: string,
  x: number,
  z: number,
  base: number,
  height: number,
  mat: StandardMaterial
) {
  const steps = 12;
  const stepH = height / steps;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const w = base * (1 - t * 0.88);
    box(app, `${name}-s${i}`, x, i * stepH + stepH * 0.5, z, w, stepH, w, mat);
  }
}

function steppedHouse(app: AppBase, x: number, z: number) {
  const m = matStone();
  let y = 0;
  const widths = [28, 22, 18, 14];
  const heights = [8, 7, 6, 5];
  widths.forEach((w, i) => {
    const h = heights[i];
    box(app, `winchester-${i}`, x + i * 3, y + h / 2, z + i * 2, w, h, w, m, i === 0);
    y += h;
  });
}

function ringBuilding(app: AppBase, name: string, x: number, z: number, radius: number, mat: StandardMaterial) {
  const segments = 12;
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const px = x + Math.cos(a) * radius;
    const pz = z + Math.sin(a) * radius;
    box(app, `${name}-${i}`, px, 6, pz, 8, 12, 6, mat);
  }
  box(app, `${name}-core`, x, 3, z, radius * 1.2, 2, radius * 1.2, matGlass());
}

function bridgeSpan(app: AppBase, name: string, x: number, z0: number, z1: number, deckY: number) {
  const orange = matOrange();
  const len = Math.abs(z1 - z0);
  const cz = (z0 + z1) * 0.5;
  box(app, `${name}-deck`, x, deckY, cz, 10, 2.5, len, orange, true);
  for (const tz of [z0 + 40, z1 - 40]) {
    box(app, `${name}-tower-${tz}`, x, deckY + 45, tz, 6, 95, 6, orange);
  }
}

/** Low-poly mock landmarks — not to scale; placement follows compressed Bay Area layout. */
export function buildBayAreaLandmarks(app: AppBase): void {
  const glass = matGlass();
  const warm = matWarmWindow();
  const stone = matStone();

  // —— San Francisco ——
  pyramid(app, 'transamerica', -930, -350, 52, 220, glass);
  box(app, 'salesforce-tower', -870, 130, -300, 22, 260, 22, glass, true);
  box(app, 'coit-tower', -640, 55, -700, 14, 110, 14, warm, true);
  box(app, 'ferry-clock', -780, 18, -520, 50, 36, 18, stone, true);
  box(app, 'ferry-tower', -780, 42, -520, 8, 28, 8, warm);
  box(app, 'palace-dome', -1040, 14, -180, 36, 16, 36, stone);
  box(app, 'palace-ring', -1040, 22, -180, 48, 6, 48, matConcrete());
  box(app, 'painted-ladies', -900, 12, -220, 42, 18, 22, warm);
  box(app, 'fishermans-pier', -720, 8, -760, 55, 8, 30, stone, true);
  box(app, 'oracle-park', -880, 14, -610, 48, 20, 40, matConcrete(), true);

  bridgeSpan(app, 'golden-gate', -1190, -820, 80, 42);

  // —— Marin / North Bay ——
  box(app, 'sausalito-hill', -1180, 25, 320, 80, 50, 40, stone, true);
  box(app, 'napa-silo', 720, 35, 1380, 18, 70, 18, warm);
  box(app, 'carquinez-tower', 520, 55, 1180, 12, 110, 12, matOrange());

  // —— East Bay ——
  pyramid(app, 'sather-campanile', 500, 80, 48, 140, warm);
  box(app, 'fox-theater', 600, 12, -360, 42, 24, 16, warm, true);
  box(app, 'fox-marquee', 600, 26, -368, 38, 4, 20, matOrange());
  ringBuilding(app, 'oakland-arena', 780, -200, 55, matConcrete());
  box(app, 'lake-merritt', 620, 4, -120, 70, 3, 50, matGlass());
  box(app, 'grizzly-lookout', 400, 28, 220, 22, 1.2, 22, matConcrete(), true);
  box(app, 'grizzly-ridge-a', 388, 22, 208, 8, 18, 8, stone, true);
  box(app, 'grizzly-ridge-b', 412, 20, 232, 10, 14, 10, stone);
  box(app, 'grizzly-sign', 400, 34, 218, 14, 7, 1.2, matOrange());
  box(app, 'grizzly-bear-silhouette', 400, 38, 218.8, 8, 5, 0.4, stone);

  // —— Vallejo ——
  box(app, 'mare-island-crane-leg-a', 430, 28, 1020, 4, 56, 4, matOrange());
  box(app, 'mare-island-crane-leg-b', 458, 28, 1020, 4, 56, 4, matOrange());
  box(app, 'mare-island-crane-beam', 444, 58, 1020, 36, 3, 3, matOrange());

  // —— Peninsula ——
  box(app, 'hoover-tower', -540, 58, -1180, 16, 116, 16, warm, true);

  bridgeSpan(app, 'dumbarton', -40, -820, -520, 8);

  // —— South Bay ——
  box(app, 'sj-city-hall-dome', 220, 22, -1580, 30, 16, 30, stone);
  box(app, 'sj-city-hall-tower', 220, 48, -1580, 10, 40, 10, warm);
  steppedHouse(app, 100, -1320);
  ringBuilding(app, 'apple-park', 480, -1420, 62, glass);
  box(app, 'sap-center', 400, 16, -1220, 55, 28, 45, matConcrete(), true);
  box(app, 'sap-sign', 400, 32, -1240, 30, 6, 4, matOrange());
}
