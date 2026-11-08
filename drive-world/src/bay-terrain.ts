import { hash2 } from './night-palette';
import { BAY_SHORE_Z } from './world-config';

/** Rolling SF/East Bay hill grade — higher as you head west, away from the bay. */
export function hillOffsetM(x: number, z: number): number {
  const inland = Math.max(0, BAY_SHORE_Z - z);
  const grade = inland * 0.014;
  const ripple = Math.sin(x * 0.011) * 3.5 + Math.cos(z * 0.008) * 2.5;
  const noise = (hash2(x * 0.1, z * 0.1) - 0.5) * 10;
  return Math.min(32, Math.max(0, grade + ripple + noise));
}
