import type { DistrictId } from './world-config';

export type StorefrontStrip = {
  id: string;
  label: string;
  district: DistrictId;
  x: number;
  z: number;
  radius: number;
  shops: string[];
};

/** Named strips — OSM-style block identity (text in HUD when nearby). */
export const STOREFRONT_STRIPS: StorefrontStrip[] = [
  {
    id: 'telegraph-row',
    label: 'Telegraph Ave',
    district: 'eastBay',
    x: 538,
    z: 28,
    radius: 75,
    shops: ['Campus Gear', 'Night Records', 'Telegraph Coffee', 'East Bay Books']
  },
  {
    id: 'emeryville-retail',
    label: 'Bay Street retail',
    district: 'eastBay',
    x: 598,
    z: -248,
    radius: 65,
    shops: ['Shellmound Goods', 'Pixar Way Gifts', 'Bay Street Bites', 'Emeryville Cycle']
  },
  {
    id: 'ferry-market',
    label: 'Embarcadero',
    district: 'sf',
    x: -780,
    z: -520,
    radius: 70,
    shops: ['Ferry Farm Table', 'Harbor Roast', 'Embarcadero Cycles', 'Pier Provisions']
  },
  {
    id: 'concord-plaza-shops',
    label: 'Concord plaza',
    district: 'eastBay',
    x: 1035,
    z: 102,
    radius: 55,
    shops: ['Diablo Outfitters', 'Plaza Bites', 'Concord Hardware', 'Treat Street']
  }
];

export function nearestStorefrontStrip(px: number, pz: number): StorefrontStrip | null {
  let best: StorefrontStrip | null = null;
  let bestD = Infinity;
  for (const s of STOREFRONT_STRIPS) {
    const d = Math.hypot(px - s.x, pz - s.z);
    if (d > s.radius) continue;
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}
