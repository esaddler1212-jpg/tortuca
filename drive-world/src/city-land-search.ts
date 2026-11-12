import { CITY_HUBS } from './city-map-registry';
import { LANDMARKS } from './landmark-registry';
import { bayRegionsGated } from './mission-chapters';
import type { SavedProgress } from './game-progress';
import { SCENIC_ROUTES } from './world-extras';
import type { DistrictId } from './world-config';

export type LandTarget = {
  id: string;
  label: string;
  x: number;
  z: number;
  kind: 'hub' | 'landmark' | 'scenic';
  scenicId?: string;
  district?: DistrictId;
};

export function landTargetDistrict(target: LandTarget): DistrictId | null {
  if (target.district) return target.district;
  if (target.kind === 'scenic') return null;
  return null;
}

export function isLandTargetAllowed(progress: SavedProgress, target: LandTarget): boolean {
  if (!bayRegionsGated(progress)) return true;
  const d = landTargetDistrict(target);
  if (!d) return false;
  return d === 'vallejo';
}

export function searchLandTargets(query: string, limit = 10): LandTarget[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const out: LandTarget[] = [];
  for (const hub of CITY_HUBS) {
    if (!hub.label.toLowerCase().includes(q) && !hub.id.includes(q)) continue;
    out.push({
      id: `hub-${hub.id}`,
      label: hub.label,
      x: hub.centerX,
      z: hub.centerZ,
      kind: 'hub',
      district: hub.district
    });
  }
  for (const lm of LANDMARKS) {
    if (!lm.name.toLowerCase().includes(q) && !lm.id.includes(q)) continue;
    out.push({
      id: `lm-${lm.id}`,
      label: lm.name,
      x: lm.x,
      z: lm.z,
      kind: 'landmark',
      district: lm.district
    });
  }
  for (const route of SCENIC_ROUTES) {
    if (!route.name.toLowerCase().includes(q) && !route.id.includes(q)) continue;
    const start = route.points[0]!;
    out.push({
      id: `scenic-${route.id}`,
      label: `Scenic: ${route.name}`,
      x: start.x,
      z: start.z,
      kind: 'scenic',
      scenicId: route.id
    });
  }
  return out.slice(0, limit);
}
