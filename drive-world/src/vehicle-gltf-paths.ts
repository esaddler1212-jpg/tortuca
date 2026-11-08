/** Kenney Car Kit (CC0) — shorepine/kenney mirror, see CREDITS.md */
const KENNEY = './models/kenney';
const CC0 = './models/cc0';

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
  default: `${KENNEY}/sedan.glb`
};

export function glbPathForVehicle(vehicleId: string): string {
  return VEHICLE_GLB[vehicleId] ?? VEHICLE_GLB.default;
}
