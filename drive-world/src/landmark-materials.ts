import { Color, StandardMaterial } from 'playcanvas';

import { BAY_BRIDGE_ORANGE } from './night-palette';

export function matConcrete(): StandardMaterial {
  const m = new StandardMaterial();
  m.diffuse = new Color(0.55, 0.54, 0.52);
  m.gloss = 0.2;
  m.update();
  return m;
}

export function matGlass(): StandardMaterial {
  const m = new StandardMaterial();
  m.diffuse = new Color(0.15, 0.22, 0.32);
  m.emissive = new Color(0.25, 0.45, 0.75);
  m.emissiveIntensity = 0.4;
  m.gloss = 0.85;
  m.metalness = 0.35;
  m.update();
  return m;
}

export function matOrange(): StandardMaterial {
  const m = new StandardMaterial();
  m.diffuse = BAY_BRIDGE_ORANGE;
  m.emissive = BAY_BRIDGE_ORANGE;
  m.emissiveIntensity = 0.45;
  m.update();
  return m;
}

export function matWarmWindow(): StandardMaterial {
  const m = new StandardMaterial();
  m.diffuse = new Color(0.12, 0.1, 0.08);
  m.emissive = new Color(0.95, 0.75, 0.45);
  m.emissiveIntensity = 0.7;
  m.update();
  return m;
}

export function matStone(): StandardMaterial {
  const m = new StandardMaterial();
  m.diffuse = new Color(0.35, 0.33, 0.32);
  m.gloss = 0.15;
  m.update();
  return m;
}
