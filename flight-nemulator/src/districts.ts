import { Vec3 } from 'playcanvas';

export interface DistrictSpec {
  id: string;
  label: string;
  inspiration: string;
  center: Vec3;
  radiusM: number;
  accent: [number, number, number];
  homeBaseName: string;
  skylineMul: number;
}

export const WORLD_HALF_M = 2000;

export const DISTRICTS: DistrictSpec[] = [
  {
    id: 'metropolis',
    label: 'Sunstone Metro',
    inspiration: 'Metropolis',
    center: new Vec3(-600, 0, -400),
    radiusM: 520,
    accent: [0.2, 0.45, 0.85],
    homeBaseName: 'Daily Planet Spire',
    skylineMul: 1.35
  },
  {
    id: 'gotham-nights',
    label: 'Gotham Nights',
    inspiration: 'Gotham',
    center: new Vec3(700, 0, -500),
    radiusM: 480,
    accent: [0.12, 0.14, 0.22],
    homeBaseName: 'Bat Cave Mouth',
    skylineMul: 1.1
  },
  {
    id: 'stark-nexus',
    label: 'Stark Nexus',
    inspiration: 'New York — Avengers Tower',
    center: new Vec3(-200, 0, 600),
    radiusM: 450,
    accent: [0.75, 0.2, 0.12],
    homeBaseName: 'Stark Spire',
    skylineMul: 1.5
  },
  {
    id: 'coast-city',
    label: 'Coast Lantern',
    inspiration: 'Coast City',
    center: new Vec3(500, 0, 700),
    radiusM: 420,
    accent: [0.1, 0.7, 0.35],
    homeBaseName: 'Emerald Pier',
    skylineMul: 0.95
  },
  {
    id: 'ki-plateau',
    label: 'Ki Plateau',
    inspiration: 'Rocky mesa',
    center: new Vec3(-900, 0, 850),
    radiusM: 380,
    accent: [0.9, 0.55, 0.2],
    homeBaseName: 'Lookout Mesa',
    skylineMul: 0.6
  },
  {
    id: 'asgard-embassy',
    label: 'Asgard Embassy',
    inspiration: 'Embassy district',
    center: new Vec3(200, 0, -900),
    radiusM: 360,
    accent: [0.35, 0.55, 0.9],
    homeBaseName: 'Rainbow Gate Plaza',
    skylineMul: 0.85
  },
  {
    id: 'wakanda-gateway',
    label: 'Wakanda Gateway',
    inspiration: 'Futuristic enclave',
    center: new Vec3(-400, 0, 200),
    radiusM: 400,
    accent: [0.15, 0.65, 0.55],
    homeBaseName: 'Vibranium Plaza',
    skylineMul: 1.05
  },
  {
    id: 'watchtower-annex',
    label: 'Watchtower Annex',
    inspiration: 'Orbital dock',
    center: new Vec3(900, 0, 200),
    radiusM: 340,
    accent: [0.55, 0.6, 0.75],
    homeBaseName: 'Orrery Deck',
    skylineMul: 0.9
  },
  {
    id: 'sokovia-memorial',
    label: 'Sokovia Memorial',
    inspiration: 'Memorial park',
    center: new Vec3(0, 0, -200),
    radiusM: 500,
    accent: [0.4, 0.42, 0.48],
    homeBaseName: 'Memorial Apex',
    skylineMul: 0.75
  }
];

export function districtForHero(districtId: string): DistrictSpec {
  return DISTRICTS.find((d) => d.id === districtId) ?? DISTRICTS[0];
}

export function spawnAtHome(districtId: string): Vec3 {
  const d = districtForHero(districtId);
  return new Vec3(d.center.x, 42, d.center.z + 30);
}
