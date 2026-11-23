import { Vec3 } from 'playcanvas';
import { DISTRICTS } from './districts';

export type SafeHouseSpec = {
  id: string;
  districtId: string;
  label: string;
  /** Offset from district center (x, y, z). */
  offset: [number, number, number];
  radiusM: number;
  /** Empty = open to any hero at home district */
  heroIds?: string[];
};

/** Rest shelters on the Battleworld ring (H interactions stack with home-mark). */
export const BATTLEWORLD_SAFE_HOUSES: SafeHouseSpec[] = [
  {
    id: 'coast-lantern-vault',
    districtId: 'coast-city',
    label: 'Lantern vault',
    offset: [0, 85, 0],
    radiusM: 220,
    heroIds: ['solar-apex', 'emerald-pilot', 'jade-architect', 'garnet-brawler', 'spectrum-artist']
  },
  {
    id: 'ki-mesa-bunker',
    districtId: 'ki-plateau',
    label: 'Mesa bunker',
    offset: [40, 55, -30],
    radiusM: 200
  },
  {
    id: 'stark-sublevel',
    districtId: 'stark-nexus',
    label: 'Sublevel lounge',
    offset: [-30, 45, 50],
    radiusM: 190,
    heroIds: ['tin-aviator', 'red-codriver', 'scarab-pilot']
  },
  {
    id: 'ion-hangar',
    districtId: 'ion-foundry',
    label: 'Alt-mode hangar',
    offset: [0, 70, 120],
    radiusM: 240,
    heroIds: ['chrome-convoy', 'crimson-ace', 'nitro-phantom']
  },
  {
    id: 'viltrum-loft',
    districtId: 'viltrum-reach',
    label: 'Viltrum safe loft',
    offset: [20, 80, -40],
    radiusM: 210,
    heroIds: ['undefeated-youth', 'atom-eve-architect']
  },
  {
    id: 'golden-nest',
    districtId: 'golden-mile',
    label: 'Milestone nest',
    offset: [-10, 95, 10],
    radiusM: 200,
    heroIds: ['condor-warden', 'bullet-ascender', 'air-mote', 'moth-signal']
  },
  {
    id: 'cosmic-conduit',
    districtId: 'cosmic-dock',
    label: 'Orbital conduit',
    offset: [50, 90, 0],
    radiusM: 220,
    heroIds: ['cosmic-envoy', 'booster-chancellor']
  },
  {
    id: 'nova-berth',
    districtId: 'nova-station',
    label: 'Deep berth',
    offset: [0, 75, -60],
    radiusM: 200,
    heroIds: ['starbound-outlaw', 'tech-jacket-host', 'spectrum-ranger']
  },
  {
    id: 'metro-sanctuary',
    districtId: 'metropolis',
    label: 'Sanctuary spire',
    offset: [0, 100, 20],
    radiusM: 210
  },
  {
    id: 'gotham-crypt',
    districtId: 'gotham-nights',
    label: 'Crypt loft',
    offset: [30, 40, -80],
    radiusM: 180
  },
  {
    id: 'watchtower-nest',
    districtId: 'watchtower-annex',
    label: 'Annex nest',
    offset: [-20, 110, 30],
    radiusM: 200
  },
  {
    id: 'asgard-gate',
    districtId: 'asgard-embassy',
    label: 'Rainbow gate shelter',
    offset: [0, 88, 0],
    radiusM: 200
  },
  {
    id: 'wakanda-grove',
    districtId: 'wakanda-gateway',
    label: 'Vibranium grove',
    offset: [25, 50, 25],
    radiusM: 190
  },
  {
    id: 'sokovia-bunker',
    districtId: 'sokovia-memorial',
    label: 'Memorial bunker',
    offset: [-40, 45, 0],
    radiusM: 200
  }
];

function districtCenter(districtId: string): Vec3 {
  const d = DISTRICTS.find((x) => x.id === districtId);
  return d ? d.center.clone() : new Vec3(0, 0, 0);
}

export function safeHouseWorldPos(house: SafeHouseSpec): Vec3 {
  const c = districtCenter(house.districtId);
  const [ox, oy, oz] = house.offset;
  return new Vec3(c.x + ox, oy, c.z + oz);
}

export function nearBattleworldSafeHouse(
  heroPos: Vec3,
  heroId: string,
  districtId: string | null
): SafeHouseSpec | null {
  for (const house of BATTLEWORLD_SAFE_HOUSES) {
    if (districtId && house.districtId !== districtId) continue;
    if (house.heroIds?.length && !house.heroIds.includes(heroId)) continue;
    const s = safeHouseWorldPos(house);
    const dx = heroPos.x - s.x;
    const dy = heroPos.y - s.y;
    const dz = heroPos.z - s.z;
    const r = house.radiusM;
    if (dx * dx + dy * dy + dz * dz < r * r) return house;
  }
  return null;
}
