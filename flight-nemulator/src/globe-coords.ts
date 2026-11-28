import { Vec3 } from 'playcanvas';

/** Planet radius for globe layout (exploration shell). */
export const GLOBE_RADIUS_M = 6200;

export function isGlobeMode(): boolean {
  return import.meta.env.VITE_BATTLEWORLD_GLOBE !== '0';
}

/** Even-ish scatter of homage cities on a sphere (golden-angle). */
export function districtGlobePosition(index: number, total: number): Vec3 {
  const t = (index + 0.5) / total;
  const phi = Math.acos(1 - 2 * t);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  const r = GLOBE_RADIUS_M;
  return new Vec3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi) * 0.92,
    r * Math.sin(phi) * Math.sin(theta)
  );
}

export function outwardNormalFromCenter(center: Vec3): Vec3 {
  const len = Math.sqrt(center.x * center.x + center.y * center.y + center.z * center.z);
  if (len < 1) return new Vec3(0, 1, 0);
  return new Vec3(center.x / len, center.y / len, center.z / len);
}

export function spawnAboveDistrictSurface(center: Vec3, altitudeM = 52): Vec3 {
  const n = outwardNormalFromCenter(center);
  return new Vec3(
    center.x + n.x * altitudeM,
    center.y + n.y * altitudeM,
    center.z + n.z * altitudeM
  );
}