import { hillOffsetM } from './bay-terrain';
import { BAY_WATER_BOUNDS, FREEWAY_ROUTES, FREEWAY_WIDTH_M, type DistrictSpec } from './world-config';

export const GRID_STREET_WIDTH_M = 12;
export const ARTERIAL_STREET_WIDTH_M = 18;

export function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const vx = bx - ax;
  const vz = bz - az;
  const len2 = vx * vx + vz * vz;
  if (len2 < 1e-6) return Math.hypot(px - ax, pz - az);
  let t = ((px - ax) * vx + (pz - az) * vz) / len2;
  t = Math.max(0, Math.min(1, t));
  const nx = ax + t * vx;
  const nz = az + t * vz;
  return Math.hypot(px - nx, pz - nz);
}

export function tooCloseToFreeway(x: number, z: number, extraClearance = 20): boolean {
  const clearance = FREEWAY_WIDTH_M * 0.55 + extraClearance;
  for (const route of FREEWAY_ROUTES) {
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i]!;
      const b = route[i + 1]!;
      if (distToSegment(x, z, a.x, a.z, b.x, b.z) < clearance) return true;
    }
  }
  return false;
}

export function inBayWater(x: number, z: number): boolean {
  return (
    x >= BAY_WATER_BOUNDS.minX &&
    x <= BAY_WATER_BOUNDS.maxX &&
    z >= BAY_WATER_BOUNDS.minZ &&
    z <= BAY_WATER_BOUNDS.maxZ
  );
}

/** Manhattan grid — streets on block boundaries between building parcels. */
export function nearDistrictStreetGrid(x: number, z: number, spec: DistrictSpec, streetW = GRID_STREET_WIDTH_M): boolean {
  const modX = ((x - spec.minX) % spec.blockM + spec.blockM) % spec.blockM;
  const modZ = ((z - spec.minZ) % spec.blockM + spec.blockM) % spec.blockM;
  const edgeX = Math.min(modX, spec.blockM - modX);
  const edgeZ = Math.min(modZ, spec.blockM - modZ);
  return edgeX < streetW * 0.55 || edgeZ < streetW * 0.55;
}

export function streetDeckY(x: number, z: number): number {
  return hillOffsetM(x, z) + 0.14;
}
