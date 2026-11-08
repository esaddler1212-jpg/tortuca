import { CITY_HUBS } from './city-map-registry';
import { LANDMARKS } from './landmark-registry';

export type LandTarget = {
  id: string;
  label: string;
  x: number;
  z: number;
  kind: 'hub' | 'landmark';
};

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
      kind: 'hub'
    });
  }
  for (const lm of LANDMARKS) {
    if (!lm.name.toLowerCase().includes(q) && !lm.id.includes(q)) continue;
    out.push({
      id: `lm-${lm.id}`,
      label: lm.name,
      x: lm.x,
      z: lm.z,
      kind: 'landmark'
    });
  }
  return out.slice(0, limit);
}
