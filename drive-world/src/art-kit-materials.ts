import { Color, StandardMaterial } from 'playcanvas';

import { applyBuildingPbr } from './building-pbr';

export { deckPbrReady, kitDeckMaterial, preloadDeckPbr } from './deck-pbr';

/** Shared emissive-forward material for district art kits. */
export function kitMaterial(em: Color, glow = 0.55, diffuse?: Color, facade = false): StandardMaterial {
  const m = new StandardMaterial();
  m.diffuse = diffuse ?? new Color(0.07, 0.07, 0.08);
  m.emissive = em.clone();
  m.emissiveIntensity = glow;
  m.gloss = 0.4;
  if (facade) applyBuildingPbr(m);
  m.update();
  return m;
}

/** Vertical kit walls (towers, garages) — optional AmbientCG facade when installed. */
export function kitFacadeMaterial(em: Color, glow = 0.22, diffuse?: Color): StandardMaterial {
  return kitMaterial(em, glow, diffuse, true);
}