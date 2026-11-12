import { Color } from 'playcanvas';

/** Karl-the-fog night — cool grey-blue over the water. */
export const NIGHT_SKY = new Color(0.04, 0.05, 0.09);
export const NIGHT_FOG = new Color(0.28, 0.32, 0.38);
export const NIGHT_AMBIENT = new Color(0.1, 0.11, 0.16);

/** International Orange + Bay window light (Victorian / office mix). */
export const BAY_WINDOW_LIGHTS = [
  new Color(0.78, 0.24, 0.11),
  new Color(0.22, 0.48, 0.58),
  new Color(0.52, 0.62, 0.48),
  new Color(0.92, 0.78, 0.48),
  new Color(0.62, 0.72, 0.88),
  new Color(0.48, 0.42, 0.68)
] as const;

export const BAY_BRIDGE_ORANGE = new Color(0.8, 0.28, 0.12);
export const BAY_WATER_DEEP = new Color(0.03, 0.08, 0.14);
export const BAY_WATER_GLOW = new Color(0.08, 0.18, 0.28);

export function hash2(x: number, z: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
