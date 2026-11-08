import { LANDMARKS, VALLEJO_SAFEHOUSE } from './landmark-registry';
import { TACO_TRUCKS } from './city-taco-trucks';

export type GasStationDef = {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
};

function nearLm(id: string, ox: number, oz: number, name: string): GasStationDef {
  const lm = LANDMARKS.find((l) => l.id === id)!;
  return { id: `gas-${id}`, name, x: lm.x + ox, z: lm.z + oz, radius: 22 };
}

/** Free fill-up pads — optional fuel sim; always refuel to full when stopped. */
export const GAS_STATIONS: GasStationDef[] = [
  { id: 'gas-vallejo-home', name: 'Vallejo estate pumps', x: VALLEJO_SAFEHOUSE.x + 18, z: VALLEJO_SAFEHOUSE.z + 32, radius: 26 },
  ...TACO_TRUCKS.map((t) => ({
    id: `gas-taco-${t.district}`,
    name: `${t.name.replace(' taco truck', '')} fuel`,
    x: t.x + 6,
    z: t.z - 5,
    radius: 20
  })),
  nearLm('chase-center', -6, 14, 'Mission Bay fuel'),
  nearLm('pixar-campus', 20, 6, 'Emeryville fuel'),
  nearLm('ferry', 14, 4, 'Embarcadero fuel'),
  nearLm('apple-park', -10, 14, 'Cupertino fuel'),
  nearLm('golden-gate', 24, 8, 'Bridge Plaza fuel'),
  nearLm('lake-merritt', -8, 10, 'Lakeshore fuel'),
  { id: 'gas-i80-rest', name: 'I-80 rest area', x: 180, z: -420, radius: 28 }
];

export function nearestGasStation(px: number, pz: number): (GasStationDef & { dist: number }) | null {
  let best: (GasStationDef & { dist: number }) | null = null;
  for (const g of GAS_STATIONS) {
    const dist = Math.hypot(px - g.x, pz - g.z);
    if (dist > g.radius) continue;
    if (!best || dist < best.dist) best = { ...g, dist };
  }
  return best;
}
