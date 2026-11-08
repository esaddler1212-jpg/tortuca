import { hash2 } from './night-palette';
import { DISTRICTS } from './world-config';

function inBounds(x: number, z: number, d: (typeof DISTRICTS)['sf']): boolean {
  return x >= d.minX && x <= d.maxX && z >= d.minZ && z <= d.maxZ;
}

/** SF-style hills; East Bay mild; Vallejo flat waterfront. */
export function hillOffsetM(x: number, z: number): number {
  const sf = DISTRICTS.sf;
  const eb = DISTRICTS.eastBay;
  const val = DISTRICTS.vallejo;

  if (inBounds(x, z, val)) {
    return hash2(x, z) * 1.5;
  }

  if (inBounds(x, z, sf)) {
    const towardPacific = Math.max(0, -z - 520);
    const grade = towardPacific * 0.014 + Math.max(0, -x - 400) * 0.006;
    const ripple = Math.sin(x * 0.01) * 4 + Math.cos(z * 0.008) * 3;
    const noise = (hash2(x * 0.1, z * 0.1) - 0.5) * 12;
    return Math.min(36, Math.max(0, grade + ripple + noise));
  }

  if (inBounds(x, z, eb)) {
    return Math.sin(x * 0.008) * 2 + hash2(x, z) * 3;
  }

  return 0;
}
