import { Color, StandardMaterial } from 'playcanvas';

export { deckPbrReady, kitDeckMaterial, preloadDeckPbr } from './deck-pbr';

/** Shared emissive-forward material for district art kits. */
export function kitMaterial(em: Color, glow = 0.55, diffuse?: Color): StandardMaterial {
  const m = new StandardMaterial();
  m.diffuse = diffuse ?? new Color(0.07, 0.07, 0.08);
  m.emissive = em.clone();
  m.emissiveIntensity = glow;
  m.gloss = 0.4;
  m.update();
  return m;
}