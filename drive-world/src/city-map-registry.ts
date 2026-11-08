import { LANDMARKS, landmarksInDistrict, type LandmarkDef } from './landmark-registry';
import type { StreetPoint } from './street-registry';
import type { DistrictId } from './world-config';

export type CityHub = {
  id: string;
  district: DistrictId;
  label: string;
  centerX: number;
  centerZ: number;
  /** Local “full map” radius — compact but landmark-complete */
  radiusM: number;
  blockM?: number;
};

/** Compact city maps — each hub is a landmark-centered neighborhood. */
export const CITY_HUBS: CityHub[] = [
  { id: 'sf-downtown', district: 'sf', label: 'Downtown SF', centerX: -820, centerZ: -420, radiusM: 280, blockM: 52 },
  { id: 'sf-north-beach', district: 'sf', label: 'North Beach & Wharf', centerX: -720, centerZ: -640, radiusM: 150, blockM: 48 },
  { id: 'marin-bridge', district: 'marin', label: 'Golden Gate', centerX: -1170, centerZ: -400, radiusM: 130, blockM: 58 },
  { id: 'marin-sausalito', district: 'marin', label: 'Sausalito', centerX: -1180, centerZ: 320, radiusM: 110, blockM: 56 },
  { id: 'oakland-lake', district: 'eastBay', label: 'Oakland', centerX: 660, centerZ: -200, radiusM: 210, blockM: 50 },
  { id: 'emeryville', district: 'eastBay', label: 'Emeryville', centerX: 598, centerZ: -248, radiusM: 95, blockM: 46 },
  { id: 'berkeley-campus', district: 'eastBay', label: 'Berkeley', centerX: 520, centerZ: 50, radiusM: 140, blockM: 48 },
  { id: 'lamorinda', district: 'eastBay', label: 'Caldecott hills', centerX: 420, centerZ: 270, radiusM: 130, blockM: 52 },
  { id: 'concord-wc', district: 'eastBay', label: 'Concord & Walnut Creek', centerX: 1070, centerZ: 70, radiusM: 120, blockM: 50 },
  { id: 'martinez', district: 'eastBay', label: 'Martinez', centerX: 1100, centerZ: 410, radiusM: 95, blockM: 50 },
  { id: 'vallejo-harbor', district: 'vallejo', label: 'Vallejo', centerX: 500, centerZ: 980, radiusM: 170, blockM: 54 },
  { id: 'napa-town', district: 'vallejo', label: 'Napa', centerX: 720, centerZ: 1360, radiusM: 105, blockM: 52 },
  { id: 'peninsula-mid', district: 'peninsula', label: 'Mid Peninsula', centerX: -420, centerZ: -1180, radiusM: 190, blockM: 50 },
  { id: 'peninsula-sfo', district: 'peninsula', label: 'SFO', centerX: -200, centerZ: -1180, radiusM: 110, blockM: 46 },
  { id: 'sj-downtown', district: 'southBay', label: 'Downtown San José', centerX: 260, centerZ: -1560, radiusM: 200, blockM: 52 },
  { id: 'silicon-valley', district: 'southBay', label: 'Silicon Valley', centerX: 400, centerZ: -1320, radiusM: 160, blockM: 54 }
];

export type LandmarkStreetRoute = {
  id: string;
  district: DistrictId;
  label: string;
  landmarkIds: string[];
  width?: number;
  ring?: boolean;
};

function lmPoint(id: string): StreetPoint {
  const lm = LANDMARKS.find((l) => l.id === id);
  if (!lm) throw new Error(`Unknown landmark ${id}`);
  return { x: lm.x, z: lm.z };
}

export function pointsForLandmarks(ids: string[]): StreetPoint[] {
  return ids.map((id) => lmPoint(id));
}

/** Drivable loops and spines through each city's monuments. */
export const LANDMARK_STREET_ROUTES: LandmarkStreetRoute[] = [
  {
    id: 'sf-monuments-loop',
    district: 'sf',
    label: 'SF monument loop',
    landmarkIds: [
      'ferry',
      'salesforce',
      'transamerica',
      'painted-ladies',
      'palace',
      'lombard',
      'oracle-park',
      'chase-center',
      'coit',
      'fishermans-wharf'
    ],
    width: 17,
    ring: true
  },
  {
    id: 'marin-coastal',
    district: 'marin',
    label: 'Marin coastal',
    landmarkIds: ['golden-gate', 'sausalito'],
    width: 16
  },
  {
    id: 'oakland-loop',
    district: 'eastBay',
    label: 'Oakland loop',
    landmarkIds: ['lake-merritt', 'emeryville-bay', 'pixar-campus', 'fox', 'oakland-arena', 'telegraph-ave'],
    width: 17,
    ring: true
  },
  {
    id: 'berkeley-spine',
    district: 'eastBay',
    label: 'Berkeley spine',
    landmarkIds: ['sather', 'telegraph-ave', 'oakland-hill-radio'],
    width: 16
  },
  {
    id: 'lamorinda-hills',
    district: 'eastBay',
    label: 'Lamorinda',
    landmarkIds: ['grizzly-peak', 'caldecott-tunnel', 'orinda'],
    width: 15
  },
  {
    id: 'wc-concord',
    district: 'eastBay',
    label: 'Contra Costa',
    landmarkIds: ['walnut-creek', 'concord'],
    width: 16
  },
  {
    id: 'vallejo-strip',
    district: 'vallejo',
    label: 'Vallejo strip',
    landmarkIds: ['vallejo-helipad', 'mare-island', 'carquinez'],
    width: 16
  },
  {
    id: 'peninsula-axis',
    district: 'peninsula',
    label: 'Peninsula',
    landmarkIds: ['sfo-skypad', 'hoover', 'dumbarton'],
    width: 17
  },
  {
    id: 'southbay-loop',
    district: 'southBay',
    label: 'South Bay loop',
    landmarkIds: ['sj-city-hall', 'winchester', 'sap-center', 'apple-park'],
    width: 17,
    ring: true
  }
];

/** Boulevards linking separate hubs in the same region. */
export const HUB_CONNECTORS: { id: string; district: DistrictId; points: StreetPoint[]; width?: number }[] = [
  {
    id: 'sf-downtown-wharf',
    district: 'sf',
    points: [lmPoint('ferry'), lmPoint('fishermans-wharf'), lmPoint('coit')],
    width: 16
  },
  {
    id: 'eastbay-telegraph',
    district: 'eastBay',
    points: [
      { x: 538, z: 220 },
      { x: 538, z: 28 },
      { x: 538, z: -120 },
      { x: 598, z: -200 },
      lmPoint('emeryville-bay'),
      { x: 620, z: -120 }
    ],
    width: 16
  },
  {
    id: 'emeryville-i80',
    district: 'eastBay',
    points: [lmPoint('emeryville-bay'), { x: 680, z: -320 }],
    width: 15
  },
  {
    id: 'eastbay-24-corridor',
    district: 'eastBay',
    points: [lmPoint('telegraph-ave'), lmPoint('caldecott-tunnel'), lmPoint('walnut-creek')],
    width: 15
  },
  {
    id: 'eastbay-shore',
    district: 'eastBay',
    points: [lmPoint('concord'), lmPoint('martinez')],
    width: 14
  },
  {
    id: 'vallejo-napa',
    district: 'vallejo',
    points: [lmPoint('mare-island'), lmPoint('napa-silo')],
    width: 14
  },
  {
    id: 'peninsula-el-camino',
    district: 'peninsula',
    points: [lmPoint('sfo-skypad'), lmPoint('hoover')],
    width: 17
  }
];

export function pointInCityHub(x: number, z: number, hub: CityHub): boolean {
  return Math.hypot(x - hub.centerX, z - hub.centerZ) <= hub.radiusM;
}

export function hubForLandmark(lm: LandmarkDef): CityHub | undefined {
  let best: CityHub | undefined;
  let bestD = Infinity;
  for (const hub of CITY_HUBS) {
    if (hub.district !== lm.district) continue;
    const d = Math.hypot(lm.x - hub.centerX, lm.z - hub.centerZ);
    if (d <= hub.radiusM + lm.visitRadius && d < bestD) {
      bestD = d;
      best = hub;
    }
  }
  return best;
}

export function hubsForDistrict(district: DistrictId): CityHub[] {
  return CITY_HUBS.filter((h) => h.district === district);
}

export function landmarkIdsInDistrict(district: DistrictId): string[] {
  return landmarksInDistrict(district).map((l) => l.id);
}
