import { LANDMARKS, type LandmarkDef } from './landmark-registry';

export function nextUnvisitedLandmark(visitedIds: string[], px: number, pz: number): LandmarkDef | null {
  let best: LandmarkDef | null = null;
  let bestD = Infinity;
  const visited = new Set(visitedIds);
  for (const lm of LANDMARKS) {
    if (visited.has(lm.id)) continue;
    const d = (lm.x - px) ** 2 + (lm.z - pz) ** 2;
    if (d < bestD) {
      bestD = d;
      best = lm;
    }
  }
  return best;
}

export function bearingDeg(px: number, pz: number, tx: number, tz: number): number {
  const dx = tx - px;
  const dz = tz - pz;
  return (Math.atan2(dx, dz) * 180) / Math.PI;
}
