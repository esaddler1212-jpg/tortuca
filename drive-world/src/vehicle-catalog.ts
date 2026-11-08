import type { DistrictId } from './world-config';

export type VehicleLocomotion = 'ground' | 'hover' | 'helicopter';

export type VehicleSpec = {
  id: string;
  name: string;
  tagline: string;
  city: string;
  region?: DistrictId;
  locomotion: VehicleLocomotion;
  mass: number;
  maxEngineForce: number;
  maxBrakingForce: number;
  maxSteering: number;
  chassis: { x: number; y: number; z: number };
  paint: { diffuse: [number, number, number]; emissive: [number, number, number]; emissiveIntensity: number };
  garageStarter?: boolean;
  aerialBonus?: boolean;
  legendBonus?: boolean;
  /** Bay culture homages — fan tribute, not affiliated */
  cultureBonus?: boolean;
};

function spec(
  id: string,
  name: string,
  tagline: string,
  city: string,
  tuning: Partial<
    Pick<
      VehicleSpec,
      | 'mass'
      | 'maxEngineForce'
      | 'maxBrakingForce'
      | 'maxSteering'
      | 'chassis'
      | 'locomotion'
    >
  >,
  paint: VehicleSpec['paint'],
  extras?: Partial<Pick<VehicleSpec, 'region' | 'garageStarter' | 'aerialBonus' | 'legendBonus' | 'cultureBonus'>>
): VehicleSpec {
  return {
    id,
    name,
    tagline,
    city,
    locomotion: tuning.locomotion ?? 'ground',
    mass: tuning.mass ?? 1050,
    maxEngineForce: tuning.maxEngineForce ?? 5200,
    maxBrakingForce: tuning.maxBrakingForce ?? 140,
    maxSteering: tuning.maxSteering ?? 0.36,
    chassis: tuning.chassis ?? { x: 0.95, y: 0.4, z: 1.9 },
    paint,
    ...extras
  };
}

/** Pick one at the Vallejo safehouse after the Waymo drop-off. */
export const GARAGE_STARTER_IDS = ['garage-cruiser', 'garage-sport', 'garage-ute', 'garage-drifter'] as const;

/** Night meet rotation — one car per district badge. */
export const DISTRICT_MEET_VEHICLE_IDS = [
  'meet-vallejo-lot',
  'meet-sf-flash',
  'meet-marin-breeze',
  'meet-east-donk',
  'meet-pen-low',
  'meet-south-arc'
] as const;

/** Craft Anything pass — procedural block bodies. */
export const CRAFT_VEHICLE_IDS = ['craft-bay-wedge', 'craft-night-lift', 'craft-street-spike'] as const;

export const BONUS_AERIAL_IDS = ['bonus-skyway-hover', 'bonus-coast-heli'] as const;

/** Pop-culture homages (not affiliated). */
export const BONUS_LEGEND_IDS = ['bonus-gotham-knight', 'bonus-scarlet-five'] as const;

/** Kenney CC0 extras — unlock via landmark parking stars. */
export const BONUS_PARKING_IDS = ['bonus-bay-van', 'bonus-night-delivery', 'bonus-marina-hatch'] as const;

/** Bay homage fleet — collectible tokens (not affiliated). */
export const BONUS_CULTURE_IDS = [
  'legend-time-warp',
  'legend-hyphy-shortbus',
  'legend-cookie-bus',
  'legend-say-hey-cadillac',
  'legend-beast-cart'
] as const;

/** EV sedan with full-map night cruise autopilot (not affiliated). */
export const AUTOPILOT_VEHICLE_ID = 'bonus-night-coil' as const;

/** Gameplay mastery — meet, sprints, chapter, vistas, heat, speed traps. */
export const BONUS_ACTIVITY_VEHICLE_IDS = [
  'bonus-sprint-king',
  'bonus-chapter-hauler',
  'bonus-vista-liner',
  'bonus-heat-shade',
  'bonus-trap-outlaw'
] as const;

export const REGION_VEHICLE_IDS: Record<DistrictId, string> = {
  sf: 'region-sf-night',
  marin: 'region-marin-coast',
  eastBay: 'region-east-bay',
  vallejo: 'region-vallejo',
  peninsula: 'region-peninsula',
  southBay: 'region-south-bay'
};

export const VEHICLE_CATALOG: Record<string, VehicleSpec> = {
  'garage-cruiser': spec(
    'garage-cruiser',
    'Safehouse Cruiser',
    'Your keys — balanced all-rounder',
    'Vallejo',
    { mass: 1080, maxEngineForce: 5400 },
    { diffuse: [0.1, 0.12, 0.16], emissive: [0.35, 0.55, 0.85], emissiveIntensity: 0.28 },
    { garageStarter: true }
  ),
  'garage-sport': spec(
    'garage-sport',
    'Safehouse Sport',
    'Your keys — loud City Nights exhaust',
    'Vallejo',
    { mass: 980, maxEngineForce: 6800, maxSteering: 0.39, chassis: { x: 0.9, y: 0.32, z: 1.75 } },
    { diffuse: [0.12, 0.05, 0.06], emissive: [0.9, 0.22, 0.15], emissiveIntensity: 0.38 },
    { garageStarter: true }
  ),
  'garage-ute': spec(
    'garage-ute',
    'Safehouse Ute',
    'Your keys — planted freeway pull',
    'Vallejo',
    { mass: 1320, maxEngineForce: 6200, maxSteering: 0.33, chassis: { x: 1.05, y: 0.48, z: 2.15 } },
    { diffuse: [0.14, 0.12, 0.1], emissive: [0.75, 0.55, 0.25], emissiveIntensity: 0.25 },
    { garageStarter: true }
  ),
  'garage-drifter': spec(
    'garage-drifter',
    'Safehouse Drifter',
    'Your keys — Vallejo yard slides',
    'Vallejo',
    {
      mass: 940,
      maxEngineForce: 6200,
      maxSteering: 0.44,
      maxBrakingForce: 120,
      chassis: { x: 0.88, y: 0.3, z: 1.72 }
    },
    { diffuse: [0.1, 0.12, 0.14], emissive: [0.55, 0.85, 0.95], emissiveIntensity: 0.42 },
    { garageStarter: true }
  ),

  'region-sf-night': spec(
    'region-sf-night',
    'Fog City GT',
    'Unlock — all SF landmarks',
    'San Francisco',
    { maxEngineForce: 6400, chassis: { x: 0.92, y: 0.34, z: 1.8 } },
    { diffuse: [0.08, 0.08, 0.12], emissive: [0.55, 0.65, 0.95], emissiveIntensity: 0.35 },
    { region: 'sf' }
  ),
  'region-marin-coast': spec(
    'region-marin-coast',
    'Headlands Roadster',
    'Unlock — all Marin landmarks',
    'Marin',
    { maxEngineForce: 6000, chassis: { x: 0.85, y: 0.3, z: 1.6 } },
    { diffuse: [0.1, 0.14, 0.12], emissive: [0.78, 0.24, 0.11], emissiveIntensity: 0.4 },
    { region: 'marin' }
  ),
  'region-east-bay': spec(
    'region-east-bay',
    'Townlow Oakland',
    'Unlock — all East Bay landmarks',
    'East Bay',
    { mass: 1120, maxEngineForce: 5800, chassis: { x: 1.02, y: 0.32, z: 2.05 } },
    { diffuse: [0.06, 0.04, 0.1], emissive: [0.65, 0.25, 0.85], emissiveIntensity: 0.38 },
    { region: 'eastBay' }
  ),
  'region-vallejo': spec(
    'region-vallejo',
    'Mare Island Muscle',
    'Unlock — all North Bay / Vallejo landmarks',
    'Vallejo',
    { mass: 1300, maxEngineForce: 7200 },
    { diffuse: [0.08, 0.08, 0.1], emissive: [0.75, 0.35, 0.15], emissiveIntensity: 0.35 },
    { region: 'vallejo' }
  ),
  'region-peninsula': spec(
    'region-peninsula',
    'Sand Hill Classic',
    'Unlock — all Peninsula landmarks',
    'Peninsula',
    { mass: 1140, maxEngineForce: 5200 },
    { diffuse: [0.16, 0.13, 0.1], emissive: [0.65, 0.5, 0.35], emissiveIntensity: 0.25 },
    { region: 'peninsula' }
  ),
  'region-south-bay': spec(
    'region-south-bay',
    'Silicon Ring EV',
    'Unlock — all South Bay landmarks',
    'South Bay',
    { mass: 1020, maxEngineForce: 6100 },
    { diffuse: [0.06, 0.06, 0.07], emissive: [0.85, 0.92, 0.95], emissiveIntensity: 0.35 },
    { region: 'southBay' }
  ),

  'bonus-skyway-hover': spec(
    'bonus-skyway-hover',
    'Skyway Hover',
    'Bonus — finish every scenic cruise route',
    'Bay Sky',
    { locomotion: 'hover', mass: 720, chassis: { x: 1.1, y: 0.28, z: 2.2 } },
    { diffuse: [0.08, 0.12, 0.18], emissive: [0.25, 0.85, 0.95], emissiveIntensity: 0.55 },
    { aerialBonus: true }
  ),
  'bonus-coast-heli': spec(
    'bonus-coast-heli',
    'Coast Guard Heli',
    'Bonus — rotor token at Vallejo Helipad',
    'North Bay',
    { locomotion: 'helicopter', mass: 1480, chassis: { x: 2.4, y: 0.55, z: 5.2 } },
    { diffuse: [0.12, 0.14, 0.16], emissive: [0.35, 0.7, 0.95], emissiveIntensity: 0.32 },
    { aerialBonus: true }
  ),

  'bonus-gotham-knight': spec(
    'bonus-gotham-knight',
    'Gotham Knight',
    'Legend — cave key at Coit Hill',
    'San Francisco',
    {
      mass: 1450,
      maxEngineForce: 8200,
      maxSteering: 0.34,
      chassis: { x: 1.12, y: 0.36, z: 2.35 }
    },
    { diffuse: [0.02, 0.02, 0.04], emissive: [0.15, 0.25, 0.95], emissiveIntensity: 0.62 },
    { legendBonus: true }
  ),
  'bonus-scarlet-five': spec(
    'bonus-scarlet-five',
    'Scarlet Five',
    'Legend — Mach V-style wedge at Winchester',
    'South Bay',
    {
      mass: 920,
      maxEngineForce: 7600,
      maxSteering: 0.42,
      chassis: { x: 0.88, y: 0.28, z: 1.72 }
    },
    { diffuse: [0.9, 0.9, 0.92], emissive: [0.95, 0.12, 0.08], emissiveIntensity: 0.38 },
    { legendBonus: true }
  ),

  'bonus-bay-van': spec(
    'bonus-bay-van',
    'Bay Shuttle Van',
    'Bonus — 4 landmark parking badges',
    'Bay Area',
    { mass: 1180, maxEngineForce: 5200, maxSteering: 0.32, chassis: { x: 1.05, y: 0.55, z: 2.35 } },
    { diffuse: [0.1, 0.12, 0.14], emissive: [0.35, 0.75, 0.95], emissiveIntensity: 0.28 },
    {}
  ),
  'bonus-night-delivery': spec(
    'bonus-night-delivery',
    'Night Courier',
    'Bonus — 8 landmark parking badges',
    'East Bay',
    { mass: 1100, maxEngineForce: 5800, chassis: { x: 0.98, y: 0.42, z: 2.1 } },
    { diffuse: [0.08, 0.09, 0.1], emissive: [0.85, 0.55, 0.2], emissiveIntensity: 0.32 },
    {}
  ),
  'bonus-marina-hatch': spec(
    'bonus-marina-hatch',
    'Marina Hot Hatch',
    'Bonus — 12 landmark parking badges',
    'Marin',
    { mass: 960, maxEngineForce: 7000, maxSteering: 0.4, chassis: { x: 0.88, y: 0.3, z: 1.72 } },
    { diffuse: [0.06, 0.1, 0.12], emissive: [0.2, 0.8, 0.75], emissiveIntensity: 0.42 },
    {}
  ),

  'legend-time-warp': spec(
    'legend-time-warp',
    'Time Warp Coupe',
    'Homage — flux token at Palace · flies on Space',
    'San Francisco',
    { locomotion: 'hover', mass: 980, chassis: { x: 0.9, y: 0.3, z: 1.85 } },
    { diffuse: [0.55, 0.56, 0.58], emissive: [0.75, 0.78, 0.82], emissiveIntensity: 0.4 },
    { cultureBonus: true, aerialBonus: true }
  ),
  'legend-hyphy-shortbus': spec(
    'legend-hyphy-shortbus',
    'Hyphy Short Bus',
    'Homage — whistle at Fox Theater',
    'Oakland',
    { mass: 1450, maxEngineForce: 5400, maxSteering: 0.3, chassis: { x: 1.08, y: 0.62, z: 2.45 } },
    { diffuse: [0.22, 0.18, 0.04], emissive: [0.98, 0.88, 0.12], emissiveIntensity: 0.55 },
    { cultureBonus: true }
  ),
  'legend-cookie-bus': spec(
    'legend-cookie-bus',
    'Cookie Tour Bus',
    'Homage — tin at Concord plaza',
    'East Bay',
    { mass: 1380, maxEngineForce: 5000, maxSteering: 0.31, chassis: { x: 1.12, y: 0.58, z: 2.5 } },
    { diffuse: [0.05, 0.12, 0.06], emissive: [0.35, 0.9, 0.42], emissiveIntensity: 0.48 },
    { cultureBonus: true }
  ),
  'legend-say-hey-cadillac': spec(
    'legend-say-hey-cadillac',
    'Say Hey Lowrider',
    'Homage — glove at Oracle Park',
    'San Francisco',
    {
      mass: 1480,
      maxEngineForce: 6200,
      maxSteering: 0.36,
      chassis: { x: 1.15, y: 0.38, z: 2.5 }
    },
    { diffuse: [0.28, 0.08, 0.14], emissive: [0.95, 0.35, 0.65], emissiveIntensity: 0.5 },
    { cultureBonus: true }
  ),
  'legend-beast-cart': spec(
    'legend-beast-cart',
    'Beast Mode Cart',
    'Homage — bell at Oakland Arena',
    'East Bay',
    { mass: 420, maxEngineForce: 2800, maxSteering: 0.45, chassis: { x: 0.55, y: 0.22, z: 0.95 } },
    { diffuse: [0.1, 0.1, 0.12], emissive: [0.55, 0.6, 0.65], emissiveIntensity: 0.3 },
    { cultureBonus: true }
  ),

  'bonus-night-coil': spec(
    'bonus-night-coil',
    'Night Coil',
    'Autopilot — Silicon wafer near Sand Hill',
    'Peninsula',
    {
      mass: 1180,
      maxEngineForce: 6400,
      maxSteering: 0.38,
      chassis: { x: 0.95, y: 0.34, z: 2.05 }
    },
    { diffuse: [0.9, 0.91, 0.93], emissive: [0.85, 0.88, 0.92], emissiveIntensity: 0.22 },
    {}
  ),

  'meet-vallejo-lot': spec(
    'meet-vallejo-lot',
    'Vallejo Lot Runner',
    'Meet — Vallejo yard sideshow',
    'Vallejo',
    { mass: 940, maxEngineForce: 7400, maxSteering: 0.41, chassis: { x: 0.86, y: 0.28, z: 1.68 } },
    { diffuse: [0.2, 0.18, 0.22], emissive: [0.95, 0.45, 0.12], emissiveIntensity: 0.48 },
    {}
  ),
  'meet-sf-flash': spec(
    'meet-sf-flash',
    'Fog Flash',
    'Meet — SF pier lot',
    'San Francisco',
    { mass: 900, maxEngineForce: 7000, maxSteering: 0.4, chassis: { x: 0.9, y: 0.32, z: 1.78 } },
    { diffuse: [0.08, 0.1, 0.12], emissive: [0.45, 0.65, 0.95], emissiveIntensity: 0.45 },
    {}
  ),
  'meet-marin-breeze': spec(
    'meet-marin-breeze',
    'Marin Breeze',
    'Meet — Sausalito view',
    'Marin',
    { mass: 1180, maxEngineForce: 5600, maxSteering: 0.35, chassis: { x: 1.02, y: 0.46, z: 2.05 } },
    { diffuse: [0.12, 0.14, 0.16], emissive: [0.35, 0.75, 0.55], emissiveIntensity: 0.35 },
    {}
  ),
  'meet-east-donk': spec(
    'meet-east-donk',
    'Town Donk',
    'Meet — East Bay lot',
    'East Bay',
    { mass: 1320, maxEngineForce: 5200, maxSteering: 0.32, chassis: { x: 1.08, y: 0.55, z: 2.35 } },
    { diffuse: [0.14, 0.1, 0.08], emissive: [0.85, 0.55, 0.2], emissiveIntensity: 0.42 },
    {}
  ),
  'meet-pen-low': spec(
    'meet-pen-low',
    'Sand Low',
    'Meet — Dumbarton lot',
    'Peninsula',
    { mass: 1080, maxEngineForce: 5800, maxSteering: 0.37, chassis: { x: 0.95, y: 0.36, z: 1.95 } },
    { diffuse: [0.16, 0.14, 0.12], emissive: [0.75, 0.6, 0.4], emissiveIntensity: 0.3 },
    {}
  ),
  'meet-south-arc': spec(
    'meet-south-arc',
    'Silicon Arc',
    'Meet — SAP load-in',
    'South Bay',
    { mass: 880, maxEngineForce: 7600, maxSteering: 0.42, chassis: { x: 0.84, y: 0.28, z: 1.65 } },
    { diffuse: [0.05, 0.07, 0.1], emissive: [0.15, 0.85, 0.92], emissiveIntensity: 0.52 },
    {}
  ),
  'craft-bay-wedge': spec(
    'craft-bay-wedge',
    'Bay Wedge',
    'Craft shard — procedural wedge',
    'Bay Area',
    { mass: 860, maxEngineForce: 7200, maxSteering: 0.43, chassis: { x: 0.82, y: 0.26, z: 1.62 } },
    { diffuse: [0.1, 0.12, 0.14], emissive: [0.25, 0.75, 0.95], emissiveIntensity: 0.55 },
    {}
  ),
  'craft-night-lift': spec(
    'craft-night-lift',
    'Night Lift',
    'Craft shard — roof rack hauler',
    'Bay Area',
    { mass: 1240, maxEngineForce: 5800, maxSteering: 0.33, chassis: { x: 1.0, y: 0.5, z: 2.1 } },
    { diffuse: [0.08, 0.08, 0.1], emissive: [0.55, 0.45, 0.95], emissiveIntensity: 0.38 },
    {}
  ),
  'craft-street-spike': spec(
    'craft-street-spike',
    'Street Spike',
    'Craft shard — finned runner',
    'Bay Area',
    { mass: 920, maxEngineForce: 6900, maxSteering: 0.41, chassis: { x: 0.9, y: 0.3, z: 1.75 } },
    { diffuse: [0.12, 0.06, 0.1], emissive: [0.95, 0.2, 0.55], emissiveIntensity: 0.48 },
    {}
  ),
  'bonus-sprint-king': spec(
    'bonus-sprint-king',
    'Sprint King F1',
    'Activity — all landmark sprints',
    'Bay Area',
    { mass: 880, maxEngineForce: 7800, maxSteering: 0.43, chassis: { x: 0.82, y: 0.26, z: 1.65 } },
    { diffuse: [0.05, 0.08, 0.12], emissive: [0.15, 0.85, 0.95], emissiveIntensity: 0.55 },
    {}
  ),
  'bonus-chapter-hauler': spec(
    'bonus-chapter-hauler',
    'Chapter Hauler',
    'Activity — Vallejo chapter complete',
    'Vallejo',
    { mass: 1380, maxEngineForce: 6500, maxSteering: 0.31, chassis: { x: 1.08, y: 0.5, z: 2.25 } },
    { diffuse: [0.12, 0.14, 0.16], emissive: [0.55, 0.72, 0.95], emissiveIntensity: 0.32 },
    {}
  ),
  'bonus-vista-liner': spec(
    'bonus-vista-liner',
    'Vista Line SUV',
    'Activity — five cruise vistas',
    'Marin',
    { mass: 1260, maxEngineForce: 5600, maxSteering: 0.34, chassis: { x: 1.02, y: 0.48, z: 2.05 } },
    { diffuse: [0.14, 0.16, 0.18], emissive: [0.35, 0.65, 0.85], emissiveIntensity: 0.3 },
    {}
  ),
  'bonus-heat-shade': spec(
    'bonus-heat-shade',
    'Heat Shade',
    'Activity — max speed-trap heat',
    'East Bay',
    {
      mass: 1020,
      maxEngineForce: 7000,
      maxSteering: 0.39,
      chassis: { x: 0.92, y: 0.32, z: 1.82 }
    },
    { diffuse: [0.04, 0.04, 0.06], emissive: [0.95, 0.2, 0.12], emissiveIntensity: 0.52 },
    {}
  ),
  'bonus-trap-outlaw': spec(
    'bonus-trap-outlaw',
    'Trap Outlaw',
    'Activity — 85+ on every speed strip',
    'Bay Area',
    { mass: 1280, maxEngineForce: 6800, maxSteering: 0.36, chassis: { x: 1.0, y: 0.38, z: 2.0 } },
    { diffuse: [0.08, 0.1, 0.14], emissive: [0.25, 0.55, 0.95], emissiveIntensity: 0.45 },
    {}
  ),
  'tokyo-shuto-runner': spec(
    'tokyo-shuto-runner',
    'Shuto Night Runner',
    'Tokyo bonus — log every Tokyo landmark',
    'Tokyo',
    { mass: 1120, maxEngineForce: 8400, maxSteering: 0.4, chassis: { x: 0.92, y: 0.3, z: 1.85 } },
    { diffuse: [0.9, 0.9, 0.92], emissive: [1, 0.2, 0.55], emissiveIntensity: 0.5 },
    { legendBonus: true }
  )
};

export function getVehicleSpec(id: string): VehicleSpec {
  const v = VEHICLE_CATALOG[id];
  if (!v) throw new Error(`Unknown vehicle: ${id}`);
  return v;
}

export function isAerialVehicle(id: string): boolean {
  const loc = VEHICLE_CATALOG[id]?.locomotion;
  return loc === 'hover' || loc === 'helicopter';
}

export function supportsAutopilot(vehicleId: string | null | undefined): boolean {
  return vehicleId === AUTOPILOT_VEHICLE_ID;
}
