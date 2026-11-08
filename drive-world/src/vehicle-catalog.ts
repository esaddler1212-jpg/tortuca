export type VehicleSpec = {
  id: string;
  name: string;
  tagline: string;
  city: string;
  mass: number;
  maxEngineForce: number;
  maxBrakingForce: number;
  maxSteering: number;
  chassis: { x: number; y: number; z: number };
  paint: { diffuse: [number, number, number]; emissive: [number, number, number]; emissiveIntensity: number };
  starter?: boolean;
};

function spec(
  id: string,
  name: string,
  tagline: string,
  city: string,
  tuning: Partial<Pick<VehicleSpec, 'mass' | 'maxEngineForce' | 'maxBrakingForce' | 'maxSteering' | 'chassis'>>,
  paint: VehicleSpec['paint'],
  starter?: boolean
): VehicleSpec {
  return {
    id,
    name,
    tagline,
    city,
    mass: tuning.mass ?? 1050,
    maxEngineForce: tuning.maxEngineForce ?? 5200,
    maxBrakingForce: tuning.maxBrakingForce ?? 140,
    maxSteering: tuning.maxSteering ?? 0.36,
    chassis: tuning.chassis ?? { x: 0.95, y: 0.4, z: 1.9 },
    paint,
    starter
  };
}

const silver: VehicleSpec['paint'] = {
  diffuse: [0.12, 0.12, 0.14],
  emissive: [0.35, 0.4, 0.5],
  emissiveIntensity: 0.2
};

export const STARTER_VEHICLE_IDS = ['sfo-rental', 'sfo-limo', 'sfo-shuttle'] as const;

export const VEHICLE_CATALOG: Record<string, VehicleSpec> = {
  'sfo-rental': spec(
    'sfo-rental',
    'Rental Compact',
    'Starter — nimble lot exit',
    'SFO',
    { mass: 920, maxEngineForce: 4800, maxSteering: 0.4, chassis: { x: 0.85, y: 0.35, z: 1.65 } },
    { diffuse: [0.1, 0.14, 0.22], emissive: [0.2, 0.45, 0.85], emissiveIntensity: 0.28 },
    true
  ),
  'sfo-limo': spec(
    'sfo-limo',
    'Black Car',
    'Starter — smooth I-80 cruise',
    'SFO',
    { mass: 1180, maxEngineForce: 5400, maxBrakingForce: 160, chassis: { x: 1.05, y: 0.42, z: 2.2 } },
    { diffuse: [0.04, 0.04, 0.05], emissive: [0.15, 0.12, 0.2], emissiveIntensity: 0.15 },
    true
  ),
  'sfo-shuttle': spec(
    'sfo-shuttle',
    'Airport Shuttle',
    'Starter — tall & planted',
    'SFO',
    { mass: 1450, maxEngineForce: 6200, maxSteering: 0.32, chassis: { x: 1.05, y: 0.55, z: 2.45 } },
    { diffuse: [0.14, 0.12, 0.1], emissive: [0.9, 0.65, 0.2], emissiveIntensity: 0.22 },
    true
  ),

  'sf-finance-sedan': spec(
    'sf-finance-sedan',
    'Embarcadero Sedan',
    'Unlocked — Financial District',
    'San Francisco',
    { mass: 1100, maxEngineForce: 5600 },
    { diffuse: [0.08, 0.1, 0.14], emissive: [0.7, 0.75, 0.8], emissiveIntensity: 0.25 }
  ),
  'sf-tech-gt': spec(
    'sf-tech-gt',
    'SoMa GT',
    'Unlocked — Salesforce skyline',
    'San Francisco',
    { mass: 980, maxEngineForce: 7200, maxSteering: 0.38 },
    { diffuse: [0.06, 0.08, 0.12], emissive: [0.25, 0.75, 1], emissiveIntensity: 0.4 }
  ),
  'sf-hill-runner': spec(
    'sf-hill-runner',
    'Telegraph Runner',
    'Unlocked — Coit & cable vibes',
    'San Francisco',
    { mass: 1020, maxEngineForce: 5000, maxSteering: 0.42 },
    { diffuse: [0.2, 0.06, 0.05], emissive: [0.95, 0.2, 0.12], emissiveIntensity: 0.35 }
  ),
  'sf-pier-wagon': spec(
    'sf-pier-wagon',
    'Pier Wagon',
    'Unlocked — Ferry waterfront',
    'San Francisco',
    { mass: 1250, maxEngineForce: 5400, chassis: { x: 1, y: 0.45, z: 2.1 } },
    { diffuse: [0.12, 0.11, 0.1], emissive: [0.55, 0.45, 0.35], emissiveIntensity: 0.22 }
  ),
  'sf-marina-coupe': spec(
    'sf-marina-coupe',
    'Marina Coupe',
    'Unlocked — Palace curve',
    'San Francisco',
    { mass: 950, maxEngineForce: 6000, chassis: { x: 0.9, y: 0.32, z: 1.75 } },
    { diffuse: [0.18, 0.17, 0.16], emissive: [0.6, 0.55, 0.5], emissiveIntensity: 0.2 }
  ),
  'sf-bridge-roadster': spec(
    'sf-bridge-roadster',
    'Bridge Roadster',
    'Unlocked — Golden Gate orange',
    'San Francisco',
    { mass: 900, maxEngineForce: 6800, chassis: { x: 0.88, y: 0.3, z: 1.7 } },
    { diffuse: [0.14, 0.06, 0.03], emissive: [0.78, 0.24, 0.11], emissiveIntensity: 0.45 }
  ),

  'marin-coastal-spyder': spec('marin-coastal-spyder', 'Sausalito Spyder', 'Unlocked — Marin coast', 'Marin', { maxEngineForce: 5800, chassis: { x: 0.82, y: 0.28, z: 1.55 } }, { diffuse: [0.1, 0.12, 0.14], emissive: [0.3, 0.65, 0.75], emissiveIntensity: 0.3 }),
  'marin-wine-truck': spec('marin-wine-truck', 'Valley Pickup', 'Unlocked — Napa silos', 'Marin', { mass: 1380, maxEngineForce: 6400, chassis: { x: 1.05, y: 0.5, z: 2.15 } }, { diffuse: [0.12, 0.08, 0.06], emissive: [0.55, 0.15, 0.2], emissiveIntensity: 0.25 }),
  'marin-flatbed': spec('marin-flatbed', 'Carquinez Flatbed', 'Unlocked — strait industry', 'Marin', { mass: 1550, maxEngineForce: 7000, maxSteering: 0.3 }, { diffuse: [0.1, 0.1, 0.1], emissive: [0.85, 0.45, 0.12], emissiveIntensity: 0.3 }),

  'east-bay-campus-ev': spec('east-bay-campus-ev', 'Campanile EV', 'Unlocked — Berkeley hills', 'East Bay', { mass: 1080, maxEngineForce: 5200, maxSteering: 0.39 }, { diffuse: [0.05, 0.12, 0.1], emissive: [0.2, 0.85, 0.55], emissiveIntensity: 0.35 }),
  'east-bay-lowrider': spec('east-bay-lowrider', 'Fox Lowrider', 'Unlocked — Uptown Oakland', 'East Bay', { mass: 1120, maxEngineForce: 5600, chassis: { x: 1.02, y: 0.3, z: 2.05 } }, { diffuse: [0.08, 0.04, 0.12], emissive: [0.7, 0.2, 0.9], emissiveIntensity: 0.4 }),
  'east-bay-rally': spec('east-bay-rally', 'Arena Rally', 'Unlocked — East Bay ring', 'East Bay', { mass: 1000, maxEngineForce: 7500, maxSteering: 0.41 }, { diffuse: [0.1, 0.1, 0.1], emissive: [0.9, 0.35, 0.1], emissiveIntensity: 0.35 }),

  'vallejo-shipyard': spec('vallejo-shipyard', 'Mare Island Muscle', 'Unlocked — Vallejo cranes', 'Vallejo', { mass: 1320, maxEngineForce: 7200, maxBrakingForce: 155 }, { diffuse: [0.08, 0.08, 0.1], emissive: [0.75, 0.28, 0.12], emissiveIntensity: 0.35 }),

  'peninsula-classic': spec('peninsula-classic', 'Hoover Classic', 'Unlocked — Stanford palm', 'Peninsula', { mass: 1150, maxEngineForce: 5000 }, { diffuse: [0.16, 0.14, 0.1], emissive: [0.7, 0.55, 0.3], emissiveIntensity: 0.22 }),
  'peninsula-ev': spec('peninsula-ev', 'Dumbarton EV', 'Unlocked — mid-bay span', 'Peninsula', { mass: 1040, maxEngineForce: 5400 }, { diffuse: [0.08, 0.1, 0.12], emissive: [0.35, 0.8, 0.95], emissiveIntensity: 0.32 }),

  'southbay-civic': spec('southbay-civic', 'Civic Sedan', 'Unlocked — San José dome', 'South Bay', { mass: 1090, maxEngineForce: 5300 }, { diffuse: [0.1, 0.1, 0.12], emissive: [0.5, 0.6, 0.75], emissiveIntensity: 0.25 }),
  'southbay-mystery-van': spec('southbay-mystery-van', 'Mystery Van', 'Unlocked — Winchester steps', 'South Bay', { mass: 1280, maxEngineForce: 5600, chassis: { x: 1, y: 0.52, z: 2.3 } }, { diffuse: [0.12, 0.1, 0.08], emissive: [0.4, 0.35, 0.5], emissiveIntensity: 0.28 }),
  'southbay-ring-ev': spec('southbay-ring-ev', 'Ring EV', 'Unlocked — Cupertino loop', 'South Bay', { mass: 980, maxEngineForce: 6200, chassis: { x: 0.92, y: 0.36, z: 1.85 } }, { diffuse: [0.06, 0.06, 0.07], emissive: [0.85, 0.9, 0.95], emissiveIntensity: 0.35 }),
  'southbay-arena-suv': spec('southbay-arena-suv', 'Shark Tank SUV', 'Unlocked — SAP ice', 'South Bay', { mass: 1420, maxEngineForce: 6500, chassis: { x: 1.08, y: 0.52, z: 2.25 } }, { diffuse: [0.08, 0.1, 0.14], emissive: [0.15, 0.45, 0.85], emissiveIntensity: 0.35 })
};

export function getVehicleSpec(id: string): VehicleSpec {
  const v = VEHICLE_CATALOG[id];
  if (!v) throw new Error(`Unknown vehicle: ${id}`);
  return v;
}
