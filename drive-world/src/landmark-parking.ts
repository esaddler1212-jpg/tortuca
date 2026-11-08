import { LANDMARKS, type LandmarkDef } from './landmark-registry';

export type LandmarkParkingSpot = {
  id: string;
  landmarkId: string;
  name: string;
  x: number;
  z: number;
  lengthM: number;
  widthM: number;
  headingDeg: number;
  headingTolDeg: number;
};

function lm(id: string): LandmarkDef {
  const row = LANDMARKS.find((l) => l.id === id);
  if (!row) throw new Error(`Unknown landmark ${id}`);
  return row;
}

function spot(
  id: string,
  landmarkId: string,
  label: string,
  offsetX: number,
  offsetZ: number,
  headingDeg: number,
  lengthM = 7.5,
  widthM = 3.6
): LandmarkParkingSpot {
  const anchor = lm(landmarkId);
  return {
    id,
    landmarkId,
    name: label,
    x: anchor.x + offsetX,
    z: anchor.z + offsetZ,
    lengthM,
    widthM,
    headingDeg,
    headingTolDeg: 22
  };
}

/** Pull-in bays beside iconic landmarks — slow roll, line up heading, earn stars. */
export const LANDMARK_PARKING: LandmarkParkingSpot[] = [
  spot('park-chase', 'chase-center', 'Chase Center garage', -12, 8, 195),
  spot('park-pixar', 'pixar-campus', 'Pixar visitor lot', 14, 12, 90),
  spot('park-oracle', 'oracle-park', 'Oracle Park lot', -10, 14, 180),
  spot('park-ferry', 'ferry', 'Ferry Building curb', 8, 10, 160),
  spot('park-coit', 'coit', 'Coit Tower turnout', 6, -8, 125),
  spot('park-lake', 'lake-merritt', 'Lake Merritt lakeside', -12, 6, 0),
  spot('park-emeryville', 'emeryville-bay', 'Bay St retail pad', 10, -6, 270),
  spot('park-apple', 'apple-park', 'Apple Park ring', -18, 0, 45),
  spot('park-sap', 'sap-center', 'SAP Center load-in', 8, 12, 200),
  spot('park-sfo', 'sfo-skypad', 'SFO cell phone lot', 6, 8, 195),
  spot('park-mare', 'mare-island', 'Mare Island yard', -8, 6, 90),
  spot('park-golden', 'golden-gate', 'Golden Gate vista', 16, 20, 70, 9, 4),
  spot('park-hoover', 'hoover', 'Hoover Tower loop', 8, -6, 210),
  spot('park-napa', 'napa-silo', 'Napa silo pull-off', -6, 10, 135)
];

export function parkingForLandmark(landmarkId: string): LandmarkParkingSpot | undefined {
  return LANDMARK_PARKING.find((p) => p.landmarkId === landmarkId);
}

function normalizeAngle(deg: number): number {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

function headingError(playerYawDeg: number, spotHeadingDeg: number): number {
  return Math.abs(normalizeAngle(playerYawDeg - spotHeadingDeg));
}

/** Local offset from spot center in spot-aligned frame (forward = heading). */
function localOffset(px: number, pz: number, spot: LandmarkParkingSpot): { along: number; across: number } {
  const rad = (spot.headingDeg * Math.PI) / 180;
  const dx = px - spot.x;
  const dz = pz - spot.z;
  const along = dx * Math.sin(rad) + dz * Math.cos(rad);
  const across = dx * Math.cos(rad) - dz * Math.sin(rad);
  return { along, across };
}

export function nearestParkingSpot(px: number, pz: number): (LandmarkParkingSpot & { dist: number }) | null {
  let best: (LandmarkParkingSpot & { dist: number }) | null = null;
  for (const s of LANDMARK_PARKING) {
    const dist = Math.hypot(px - s.x, pz - s.z);
    const reach = Math.max(s.lengthM, s.widthM) * 0.85 + 8;
    if (dist > reach) continue;
    if (!best || dist < best.dist) best = { ...s, dist };
  }
  return best;
}

export function scoreParking(
  mph: number,
  px: number,
  pz: number,
  yawDeg: number,
  spot: LandmarkParkingSpot
): 0 | 1 | 2 | 3 {
  const { along, across } = localOffset(px, pz, spot);
  const halfL = spot.lengthM * 0.5;
  const halfW = spot.widthM * 0.5;
  if (Math.abs(along) > halfL || Math.abs(across) > halfW) return 0;
  const headErr = headingError(yawDeg, spot.headingDeg);
  const centered = 1 - Math.min(1, Math.hypot(along / halfL, across / halfW));
  if (mph <= 2.5 && headErr <= spot.headingTolDeg && centered > 0.55) return 3;
  if (mph <= 4.5 && headErr <= spot.headingTolDeg * 1.35 && centered > 0.35) return 2;
  if (mph <= 7 && headErr <= spot.headingTolDeg * 1.8) return 1;
  return 0;
}

export function parkingSpotCount(): number {
  return LANDMARK_PARKING.length;
}

export function parkingStarsEarned(stars: Record<string, number>): number {
  return Object.values(stars).reduce((a, b) => a + b, 0);
}

export function parkingSpotsCleared(stars: Record<string, number>): number {
  return Object.keys(stars).filter((id) => (stars[id] ?? 0) > 0).length;
}
