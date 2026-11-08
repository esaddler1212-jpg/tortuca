/** Kenney Car Kit (CC0) — shorepine/kenney mirror, see CREDITS.md */
const KENNEY = './models/kenney';
const CC0 = './models/cc0';

/** Block-mesh bodies only (no Kenney GLB). */
export const BLOCK_BODY_VEHICLE_IDS = new Set<string>(['legend-beast-cart']);

export const VEHICLE_GLB: Record<string, string> = {
  'garage-cruiser': `${KENNEY}/sedan.glb`,
  'garage-sport': `${KENNEY}/hatchback-sports.glb`,
  'garage-ute': `${KENNEY}/truck.glb`,
  'region-sf-night': `${KENNEY}/taxi.glb`,
  'region-marin-coast': `${KENNEY}/suv.glb`,
  'region-east-bay': `${KENNEY}/police.glb`,
  'region-vallejo': `${KENNEY}/delivery.glb`,
  'region-peninsula': `${KENNEY}/sedan.glb`,
  'region-south-bay': `${KENNEY}/race-future.glb`,
  'bonus-skyway-hover': `${KENNEY}/race-future.glb`,
  'bonus-coast-heli': `${CC0}/helicopter.glb`,
  'bonus-gotham-knight': `${KENNEY}/sedan-sports.glb`,
  'bonus-scarlet-five': `${KENNEY}/race.glb`,
  'bonus-night-coil': `${KENNEY}/sedan-sports.glb`,
  'bonus-bay-van': `${KENNEY}/van.glb`,
  'bonus-night-delivery': `${KENNEY}/delivery.glb`,
  'bonus-marina-hatch': `${KENNEY}/hatchback-sports.glb`,
  'legend-time-warp': `${KENNEY}/race-future.glb`,
  'legend-hyphy-shortbus': `${KENNEY}/van.glb`,
  'legend-cookie-bus': `${KENNEY}/van.glb`,
  'legend-say-hey-cadillac': `${KENNEY}/sedan.glb`,
  'bonus-meet-racer': `${KENNEY}/race.glb`,
  'bonus-sprint-king': `${KENNEY}/race-future.glb`,
  'bonus-chapter-hauler': `${KENNEY}/truck.glb`,
  'bonus-vista-liner': `${KENNEY}/suv.glb`,
  'bonus-heat-shade': `${KENNEY}/sedan-sports.glb`,
  'bonus-trap-outlaw': `${KENNEY}/police.glb`,
  default: `${KENNEY}/sedan.glb`
};

export function glbPathForVehicle(vehicleId: string): string | null {
  if (BLOCK_BODY_VEHICLE_IDS.has(vehicleId)) return null;
  return VEHICLE_GLB[vehicleId] ?? VEHICLE_GLB.default;
}
