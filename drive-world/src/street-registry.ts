import type { DistrictId } from './world-config';

export type StreetPoint = { x: number; z: number };

export type NamedStreet = {
  id: string;
  label: string;
  district: DistrictId;
  points: StreetPoint[];
  /** Default ARTERIAL width */
  width?: number;
};

/**
 * Named arterials — compressed bearings from Bay Area street maps (Market, Telegraph, Broadway, El Camino, etc.).
 */
export const NAMED_STREETS: NamedStreet[] = [
  {
    id: 'embarcadero',
    label: 'Embarcadero',
    district: 'sf',
    points: [
      { x: -840, z: -760 },
      { x: -810, z: -620 },
      { x: -790, z: -480 },
      { x: -770, z: -340 }
    ],
    width: 18
  },
  {
    id: 'market',
    label: 'Market St',
    district: 'sf',
    points: [
      { x: -920, z: -680 },
      { x: -850, z: -610 },
      { x: -780, z: -540 },
      { x: -700, z: -470 }
    ],
    width: 20
  },
  {
    id: 'mission',
    label: 'Mission St',
    district: 'sf',
    points: [
      { x: -760, z: -720 },
      { x: -740, z: -520 },
      { x: -720, z: -320 }
    ],
    width: 17
  },
  {
    id: 'van-ness',
    label: 'Van Ness Ave',
    district: 'sf',
    points: [
      { x: -680, z: -760 },
      { x: -660, z: -560 },
      { x: -640, z: -360 }
    ],
    width: 17
  },
  {
    id: 'geary',
    label: 'Geary Blvd',
    district: 'sf',
    points: [
      { x: -900, z: -380 },
      { x: -820, z: -400 },
      { x: -740, z: -420 }
    ],
    width: 18
  },
  {
    id: 'california-sf',
    label: 'California St',
    district: 'sf',
    points: [
      { x: -880, z: -320 },
      { x: -800, z: -340 },
      { x: -720, z: -360 }
    ],
    width: 17
  },
  {
    id: 'columbus',
    label: 'Columbus Ave',
    district: 'sf',
    points: [
      { x: -760, z: -700 },
      { x: -740, z: -600 },
      { x: -720, z: -500 }
    ],
    width: 15
  },
  {
    id: 'telegraph',
    label: 'Telegraph Ave',
    district: 'eastBay',
    points: [
      { x: 538, z: 220 },
      { x: 538, z: 100 },
      { x: 538, z: 28 },
      { x: 538, z: -120 },
      { x: 538, z: -280 }
    ],
    width: 16
  },
  {
    id: 'broadway-oak',
    label: 'Broadway',
    district: 'eastBay',
    points: [
      { x: 660, z: -380 },
      { x: 640, z: -240 },
      { x: 620, z: -80 },
      { x: 600, z: 80 }
    ],
    width: 20
  },
  {
    id: 'international',
    label: 'International Blvd',
    district: 'eastBay',
    points: [
      { x: 720, z: -420 },
      { x: 740, z: -620 },
      { x: 760, z: -820 },
      { x: 780, z: -1020 }
    ],
    width: 18
  },
  {
    id: 'san-pablo',
    label: 'San Pablo Ave',
    district: 'eastBay',
    points: [
      { x: 480, z: 40 },
      { x: 520, z: -100 },
      { x: 560, z: -240 },
      { x: 600, z: -380 }
    ],
    width: 17
  },
  {
    id: 'macarthur',
    label: 'MacArthur Blvd',
    district: 'eastBay',
    points: [
      { x: 520, z: -60 },
      { x: 600, z: -80 },
      { x: 700, z: -100 }
    ],
    width: 17
  },
  {
    id: 'emeryville-bay-st',
    label: 'Bay St',
    district: 'eastBay',
    points: [
      { x: 520, z: -248 },
      { x: 598, z: -248 },
      { x: 676, z: -248 }
    ],
    width: 16
  },
  {
    id: 'emeryville-shellmound',
    label: 'Shellmound St',
    district: 'eastBay',
    points: [
      { x: 540, z: -290 },
      { x: 598, z: -270 },
      { x: 656, z: -250 }
    ],
    width: 15
  },
  {
    id: 'emeryville-powell',
    label: 'Powell St',
    district: 'eastBay',
    points: [
      { x: 598, z: -300 },
      { x: 598, z: -248 },
      { x: 598, z: -196 }
    ],
    width: 14
  },
  {
    id: 'emeryville-christie',
    label: 'Christie St',
    district: 'eastBay',
    points: [
      { x: 572, z: -310 },
      { x: 572, z: -248 },
      { x: 572, z: -186 }
    ],
    width: 14
  },
  {
    id: 'shattuck',
    label: 'Shattuck Ave',
    district: 'eastBay',
    points: [
      { x: 480, z: 120 },
      { x: 500, z: 50 },
      { x: 520, z: -20 }
    ],
    width: 16
  },
  {
    id: 'university-berkeley',
    label: 'University Ave',
    district: 'eastBay',
    points: [
      { x: 560, z: 80 },
      { x: 540, z: 20 },
      { x: 520, z: -40 }
    ],
    width: 17
  },
  {
    id: 'lake-merritt',
    label: 'Lake Merritt Blvd',
    district: 'eastBay',
    points: [
      { x: 560, z: -40 },
      { x: 600, z: -100 },
      { x: 640, z: -120 },
      { x: 690, z: -90 }
    ],
    width: 16
  },
  {
    id: 'wc-broadway',
    label: 'N Broadway',
    district: 'eastBay',
    points: [
      { x: 1060, z: 120 },
      { x: 1105, z: 48 },
      { x: 1140, z: -10 }
    ],
    width: 16
  },
  {
    id: 'el-camino',
    label: 'El Camino Real',
    district: 'peninsula',
    points: [
      { x: -700, z: -1100 },
      { x: -620, z: -1280 },
      { x: -480, z: -1480 },
      { x: -280, z: -1680 },
      { x: -60, z: -1820 }
    ],
    width: 18
  },
  {
    id: 'santa-clara',
    label: 'Santa Clara St',
    district: 'southBay',
    points: [
      { x: 120, z: -1520 },
      { x: 220, z: -1580 },
      { x: 340, z: -1620 },
      { x: 480, z: -1650 }
    ],
    width: 18
  },
  {
    id: 'the-alameda',
    label: 'The Alameda',
    district: 'southBay',
    points: [
      { x: 80, z: -1480 },
      { x: 200, z: -1520 },
      { x: 320, z: -1560 }
    ],
    width: 17
  },
  {
    id: 'stevens-creek',
    label: 'Stevens Creek Blvd',
    district: 'southBay',
    points: [
      { x: 320, z: -1380 },
      { x: 400, z: -1340 },
      { x: 500, z: -1300 }
    ],
    width: 18
  },
  {
    id: 'sonoma-blvd',
    label: 'Sonoma Blvd',
    district: 'vallejo',
    points: [
      { x: 440, z: 860 },
      { x: 480, z: 960 },
      { x: 520, z: 1060 },
      { x: 560, z: 1160 }
    ],
    width: 16
  },
  {
    id: 'napa-first',
    label: 'First St',
    district: 'vallejo',
    points: [
      { x: 680, z: 1280 },
      { x: 720, z: 1380 },
      { x: 760, z: 1480 }
    ],
    width: 14
  },
  {
    id: 'bridgeway',
    label: 'Bridgeway',
    district: 'marin',
    points: [
      { x: -1140, z: 160 },
      { x: -1170, z: 280 },
      { x: -1190, z: 400 },
      { x: -1200, z: 520 }
    ],
    width: 14
  }
];
