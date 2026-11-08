/** Playable half-extent in metres (full width = 2 × WORLD_HALF_M). */
export const WORLD_HALF_M = 2000;

/** Dashed centre-line spacing along main axes (metres). */
export const STRIPE_SPACING_M = 40;

/** Low-poly night city — procedural block radius from origin. */
export const CITY_HALF_M = 850;
export const CITY_BLOCK_M = 72;
export const HIGHWAY_HALF_WIDTH_M = 22;

/**
 * Bay geography (stylised): San Francisco–style peninsula with the bay to +Z (east).
 * West (−Z) rises into hills; east (+Z) opens to water.
 */
export const BAY_SHORE_Z = 640;
export const BAY_WATER_CENTER_Z = 1100;
export const BAY_WATER_DEPTH_M = 700;

/** Vehicle tuning — high top speed, no artificial caps. */
export const DRIVE_TUNING = {
  maxEngineForce: 5500,
  maxBrakingForce: 140,
  maxSteering: 0.36,
  mass: 1050,
  linearDamping: 0.02
} as const;
