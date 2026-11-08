import type { DistrictId } from './world-config';

export type LandmarkDef = {
  id: string;
  name: string;
  district: DistrictId;
  x: number;
  z: number;
  visitRadius: number;
  unlockVehicleId: string;
};

export const VALLEJO_SAFEHOUSE = { id: 'vallejo-safehouse', name: 'Safehouse', x: 500, z: 900, radius: 42 } as const;
export const SFO_AIRPORT_LOT = { x: -420, z: -1260, heading: 15 } as const;

export const LANDMARKS: LandmarkDef[] = [
  { id: 'transamerica', name: 'Transamerica Pyramid', district: 'sf', x: -930, z: -350, visitRadius: 55, unlockVehicleId: 'sf-finance-sedan' },
  { id: 'salesforce', name: 'Salesforce Tower', district: 'sf', x: -870, z: -300, visitRadius: 50, unlockVehicleId: 'sf-tech-gt' },
  { id: 'coit', name: 'Coit Tower', district: 'sf', x: -640, z: -700, visitRadius: 45, unlockVehicleId: 'sf-hill-runner' },
  { id: 'ferry', name: 'Ferry Building', district: 'sf', x: -780, z: -520, visitRadius: 50, unlockVehicleId: 'sf-pier-wagon' },
  { id: 'palace', name: 'Palace of Fine Arts', district: 'sf', x: -1040, z: -180, visitRadius: 52, unlockVehicleId: 'sf-marina-coupe' },
  { id: 'golden-gate', name: 'Golden Gate Bridge', district: 'marin', x: -1190, z: -420, visitRadius: 70, unlockVehicleId: 'sf-bridge-roadster' },
  { id: 'sausalito', name: 'Sausalito hillside', district: 'marin', x: -1180, z: 320, visitRadius: 48, unlockVehicleId: 'marin-coastal-spyder' },
  { id: 'napa-silo', name: 'Napa silo', district: 'vallejo', x: 720, z: 1380, visitRadius: 45, unlockVehicleId: 'marin-wine-truck' },
  { id: 'carquinez', name: 'Carquinez tower', district: 'vallejo', x: 520, z: 1180, visitRadius: 45, unlockVehicleId: 'marin-flatbed' },
  { id: 'sather', name: 'Sather Campanile', district: 'eastBay', x: 500, z: 80, visitRadius: 50, unlockVehicleId: 'east-bay-campus-ev' },
  { id: 'fox', name: 'Fox Theater', district: 'eastBay', x: 600, z: -360, visitRadius: 48, unlockVehicleId: 'east-bay-lowrider' },
  { id: 'oakland-arena', name: 'Oakland Arena', district: 'eastBay', x: 780, z: -200, visitRadius: 58, unlockVehicleId: 'east-bay-rally' },
  { id: 'mare-island', name: 'Mare Island crane', district: 'vallejo', x: 444, z: 1020, visitRadius: 50, unlockVehicleId: 'vallejo-shipyard' },
  { id: 'hoover', name: 'Hoover Tower', district: 'peninsula', x: -540, z: -1180, visitRadius: 48, unlockVehicleId: 'peninsula-classic' },
  { id: 'dumbarton', name: 'Dumbarton Bridge', district: 'peninsula', x: -40, z: -670, visitRadius: 65, unlockVehicleId: 'peninsula-ev' },
  { id: 'sj-city-hall', name: 'San José City Hall', district: 'southBay', x: 220, z: -1580, visitRadius: 50, unlockVehicleId: 'southbay-civic' },
  { id: 'winchester', name: 'Winchester steps', district: 'southBay', x: 100, z: -1320, visitRadius: 55, unlockVehicleId: 'southbay-mystery-van' },
  { id: 'apple-park', name: 'Apple Park ring', district: 'southBay', x: 480, z: -1420, visitRadius: 65, unlockVehicleId: 'southbay-ring-ev' },
  { id: 'sap-center', name: 'SAP Center', district: 'southBay', x: 400, z: -1220, visitRadius: 52, unlockVehicleId: 'southbay-arena-suv' }
];
