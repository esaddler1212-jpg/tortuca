import { Color } from 'playcanvas';

export const NIGHT_SKY = new Color(0.02, 0.025, 0.07);
export const NIGHT_FOG = new Color(0.04, 0.05, 0.12);
export const NIGHT_AMBIENT = new Color(0.06, 0.07, 0.14);

/** Emissive accents for low-poly towers (windows / neon strips). */
export const NEON_ACCENTS = [
  new Color(0.9, 0.2, 0.55),
  new Color(0.15, 0.85, 0.95),
  new Color(0.95, 0.55, 0.12),
  new Color(0.55, 0.25, 0.95),
  new Color(0.35, 0.95, 0.55),
  new Color(0.95, 0.35, 0.35)
] as const;

export function hash2(x: number, z: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
