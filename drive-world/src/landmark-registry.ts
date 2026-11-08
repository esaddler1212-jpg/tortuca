import type { DistrictId } from './world-config';
import { REGION_VEHICLE_IDS } from './vehicle-catalog';

export type LandmarkDef = {
  id: string;
  name: string;
  district: DistrictId;
  x: number;
  z: number;
  visitRadius: number;
};

export const VALLEJO_SAFEHOUSE = { id: 'vallejo-safehouse', name: 'Safehouse', x: 500, z: 900, radius: 42 } as const;
export const SFO_AIRPORT_LOT = { x: -420, z: -1260, heading: 195 } as const;

export const LANDMARKS: LandmarkDef[] = [
  { id: 'transamerica', name: 'Transamerica Pyramid', district: 'sf', x: -930, z: -350, visitRadius: 55 },
  { id: 'salesforce', name: 'Salesforce Tower', district: 'sf', x: -870, z: -300, visitRadius: 50 },
  { id: 'coit', name: 'Coit Tower', district: 'sf', x: -640, z: -700, visitRadius: 45 },
  { id: 'ferry', name: 'Ferry Building', district: 'sf', x: -780, z: -520, visitRadius: 50 },
  { id: 'palace', name: 'Palace of Fine Arts', district: 'sf', x: -1040, z: -180, visitRadius: 52 },
  { id: 'lombard', name: 'Lombard Street', district: 'sf', x: -780, z: -640, visitRadius: 48 },
  { id: 'painted-ladies', name: 'Painted Ladies', district: 'sf', x: -900, z: -220, visitRadius: 48 },
  { id: 'fishermans-wharf', name: "Fisherman's Wharf", district: 'sf', x: -720, z: -760, visitRadius: 52 },
  { id: 'golden-gate', name: 'Golden Gate Bridge', district: 'marin', x: -1190, z: -420, visitRadius: 70 },
  { id: 'sausalito', name: 'Sausalito hillside', district: 'marin', x: -1180, z: 320, visitRadius: 48 },
  { id: 'napa-silo', name: 'Napa silo', district: 'vallejo', x: 720, z: 1380, visitRadius: 45 },
  { id: 'carquinez', name: 'Carquinez tower', district: 'vallejo', x: 520, z: 1180, visitRadius: 45 },
  { id: 'sather', name: 'Sather Campanile', district: 'eastBay', x: 500, z: 80, visitRadius: 50 },
  { id: 'fox', name: 'Fox Theater', district: 'eastBay', x: 600, z: -360, visitRadius: 48 },
  { id: 'oakland-arena', name: 'Oakland Arena', district: 'eastBay', x: 780, z: -200, visitRadius: 58 },
  { id: 'lake-merritt', name: 'Lake Merritt', district: 'eastBay', x: 620, z: -120, visitRadius: 55 },
  { id: 'emeryville-bay', name: 'Emeryville Bay St', district: 'eastBay', x: 598, z: -248, visitRadius: 50 },
  { id: 'pixar-campus', name: 'Pixar Campus', district: 'eastBay', x: 618, z: -278, visitRadius: 55 },
  { id: 'grizzly-peak', name: 'Grizzly Peak', district: 'eastBay', x: 400, z: 220, visitRadius: 58 },
  { id: 'oracle-park', name: 'Oracle Park', district: 'sf', x: -880, z: -610, visitRadius: 55 },
  { id: 'chase-center', name: 'Chase Center', district: 'sf', x: -878, z: -598, visitRadius: 58 },
  { id: 'mare-island', name: 'Mare Island crane', district: 'vallejo', x: 444, z: 1020, visitRadius: 50 },
  { id: 'hoover', name: 'Hoover Tower', district: 'peninsula', x: -540, z: -1180, visitRadius: 48 },
  { id: 'dumbarton', name: 'Dumbarton Bridge', district: 'peninsula', x: -40, z: -670, visitRadius: 65 },
  { id: 'sj-city-hall', name: 'San José City Hall', district: 'southBay', x: 220, z: -1580, visitRadius: 50 },
  { id: 'winchester', name: 'Winchester steps', district: 'southBay', x: 100, z: -1320, visitRadius: 55 },
  { id: 'apple-park', name: 'Apple Park ring', district: 'southBay', x: 480, z: -1420, visitRadius: 65 },
  { id: 'sap-center', name: 'SAP Center', district: 'southBay', x: 400, z: -1220, visitRadius: 52 },
  { id: 'sfo-skypad', name: 'SFO Skypad', district: 'peninsula', x: -180, z: -1180, visitRadius: 58 },
  { id: 'vallejo-helipad', name: 'Vallejo Helipad', district: 'vallejo', x: 540, z: 920, visitRadius: 48 },
  { id: 'oakland-hill-radio', name: 'Oakland Hill radio', district: 'eastBay', x: 360, z: 160, visitRadius: 55 },
  { id: 'telegraph-ave', name: 'Telegraph Ave', district: 'eastBay', x: 538, z: 28, visitRadius: 52 },
  { id: 'caldecott-tunnel', name: 'Caldecott Tunnel', district: 'eastBay', x: 392, z: 265, visitRadius: 62 },
  { id: 'orinda', name: 'Orinda hillside', district: 'eastBay', x: 458, z: 332, visitRadius: 50 },
  { id: 'concord', name: 'Concord plaza', district: 'eastBay', x: 1035, z: 102, visitRadius: 55 },
  { id: 'walnut-creek', name: 'Walnut Creek', district: 'eastBay', x: 1105, z: 48, visitRadius: 52 },
  { id: 'martinez', name: 'Martinez shoreline', district: 'eastBay', x: 1110, z: 415, visitRadius: 58 }
];

export function landmarksInDistrict(district: DistrictId): LandmarkDef[] {
  return LANDMARKS.filter((lm) => lm.district === district);
}

export function districtLandmarkTotal(district: DistrictId): number {
  return landmarksInDistrict(district).length;
}

export function districtLandmarksVisited(visitedIds: string[], district: DistrictId): number {
  const set = new Set(visitedIds);
  return landmarksInDistrict(district).filter((lm) => set.has(lm.id)).length;
}

export function isDistrictComplete(visitedIds: string[], district: DistrictId): boolean {
  const need = landmarksInDistrict(district);
  if (need.length === 0) return false;
  const set = new Set(visitedIds);
  return need.every((lm) => set.has(lm.id));
}

export function regionUnlockVehicleId(district: DistrictId): string {
  return REGION_VEHICLE_IDS[district];
}

export const DISTRICT_LABELS: Record<DistrictId, string> = {
  sf: 'San Francisco',
  marin: 'Marin',
  eastBay: 'East Bay',
  vallejo: 'Vallejo / North Bay',
  peninsula: 'Peninsula',
  southBay: 'South Bay'
};
