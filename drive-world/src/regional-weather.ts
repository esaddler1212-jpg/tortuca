import { DISTRICTS, type DistrictId } from './world-config';

export function districtAt(x: number, z: number): DistrictId | null {
  for (const id of Object.keys(DISTRICTS) as DistrictId[]) {
    const d = DISTRICTS[id];
    if (x >= d.minX && x <= d.maxX && z >= d.minZ && z <= d.maxZ) return id;
  }
  return null;
}

/** Karl-style fog intensity 0–1 by region. */
export function regionalFogStrength(district: DistrictId | null): number {
  if (!district) return 0.35;
  switch (district) {
    case 'sf':
      return 0.92;
    case 'marin':
      return 0.75;
    case 'peninsula':
      return 0.55;
    default:
      return 0.4;
  }
}

export function fogDistances(strength: number, quality: 'low' | 'med' | 'high'): { start: number; end: number } {
  const q = quality === 'low' ? 0.75 : quality === 'high' ? 1.2 : 1;
  return {
    start: 40 + strength * 30 * q,
    end: (900 + (1 - strength) * 1400) * q
  };
}
