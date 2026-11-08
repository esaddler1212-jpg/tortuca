/** Scenic pull-offs — cruise-only, no mission fail state. */
export type CruiseVistaDef = {
  id: string;
  name: string;
  tagline: string;
  x: number;
  z: number;
  radius: number;
  /** World point the vista bench faces */
  lookAtX: number;
  lookAtZ: number;
};

export const CRUISE_VISTAS: CruiseVistaDef[] = [
  {
    id: 'marin-gate',
    name: 'Marin gate overlook',
    tagline: 'Bridge necklace on the horizon',
    x: -1080,
    z: -320,
    radius: 48,
    lookAtX: -80,
    lookAtZ: -420
  },
  {
    id: 'bay-bridge-east',
    name: 'Bay Bridge east vista',
    tagline: 'Deck lights over the bay',
    x: 240,
    z: -520,
    radius: 52,
    lookAtX: 120,
    lookAtZ: -448
  },
  {
    id: 'twin-peaks',
    name: 'Twin Peaks turn',
    tagline: 'City grid under fog',
    x: -780,
    z: -380,
    radius: 44,
    lookAtX: -720,
    lookAtZ: -520
  },
  {
    id: 'skyline-pen',
    name: 'Skyline crest',
    tagline: 'Peninsula spine southward',
    x: -420,
    z: -1180,
    radius: 50,
    lookAtX: -120,
    lookAtZ: -1420
  },
  {
    id: 'caldecott-rim',
    name: 'Caldecott rim',
    tagline: 'Tunnel mouth in the hills',
    x: 420,
    z: 310,
    radius: 46,
    lookAtX: 392,
    lookAtZ: 265
  },
  {
    id: 'lacamas-vallejo',
    name: 'Vallejo waterfront',
    tagline: 'Safehouse harbor glow',
    x: 520,
    z: 920,
    radius: 55,
    lookAtX: 480,
    lookAtZ: 1040
  },
  {
    id: 'walnut-ridge',
    name: 'Walnut Creek ridge',
    tagline: '24 corridor toward Concord',
    x: 1060,
    z: 60,
    radius: 48,
    lookAtX: 1105,
    lookAtZ: 48
  },
  {
    id: 'south-bay-spine',
    name: 'South Bay spine',
    tagline: '880 ribbon northbound',
    x: 680,
    z: -1180,
    radius: 52,
    lookAtX: 500,
    lookAtZ: -1280
  },
  {
    id: 'telegraph-berk',
    name: 'Telegraph pull-off',
    tagline: 'Campus neon north',
    x: 528,
    z: 45,
    radius: 42,
    lookAtX: 538,
    lookAtZ: 28
  },
  {
    id: 'aerial-bay',
    name: 'Bay skylane perch',
    tagline: 'Hover — slow and look down',
    x: -120,
    z: 80,
    radius: 90,
    lookAtX: 120,
    lookAtZ: -448
  }
];

export function nearestCruiseVista(px: number, pz: number): { vista: CruiseVistaDef; dist: number } | null {
  let best: CruiseVistaDef | null = null;
  let bestD = Infinity;
  for (const v of CRUISE_VISTAS) {
    const d = Math.hypot(px - v.x, pz - v.z);
    if (d < v.radius && d < bestD) {
      bestD = d;
      best = v;
    }
  }
  return best ? { vista: best, dist: bestD } : null;
}
