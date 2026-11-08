import type { DistrictId } from './world-config';

export type TacoTruckDef = {
  district: DistrictId;
  name: string;
  x: number;
  z: number;
  radius: number;
};

/** One checkpoint taco truck per region — pair with any landmark in that city to unlock car + safehouse. */
export const TACO_TRUCKS: TacoTruckDef[] = [
  {
    district: 'sf',
    name: 'Mission Bay taco truck',
    x: -882,
    z: -592,
    radius: 28
  },
  {
    district: 'marin',
    name: 'Bridgeway taco truck',
    x: -1175,
    z: 305,
    radius: 26
  },
  {
    district: 'eastBay',
    name: 'Emeryville taco truck',
    x: 625,
    z: -268,
    radius: 28
  },
  {
    district: 'vallejo',
    name: 'Harbor taco truck',
    x: 495,
    z: 985,
    radius: 28
  },
  {
    district: 'peninsula',
    name: 'Peninsula taco truck',
    x: -545,
    z: -1175,
    radius: 28
  },
  {
    district: 'southBay',
    name: 'San José taco truck',
    x: 395,
    z: -1395,
    radius: 28
  }
];

export function tacoTruckForDistrict(district: DistrictId): TacoTruckDef | undefined {
  return TACO_TRUCKS.find((t) => t.district === district);
}
