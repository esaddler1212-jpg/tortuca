/** WGS84 ↔ game meters — Tier 5 georeference (HUD / offline tooling; sim stays in game XZ). */

export type Wgs84 = { lon: number; lat: number };
export type GameXZ = { x: number; z: number };

/** Least-squares fit from control landmarks (see `GEO_CONTROL_POINTS`). */
const X_COEFF = { lon: 9195.54574954, lat: 8155.19300788, bias: 816645.61236789 };
const Z_COEFF = { lon: 1411.14489489, lat: 3998.88974363, bias: 21138.05506195 };

export function wgs84ToGame(lon: number, lat: number): GameXZ {
  return {
    x: X_COEFF.lon * lon + X_COEFF.lat * lat + X_COEFF.bias,
    z: Z_COEFF.lon * lon + Z_COEFF.lat * lat + Z_COEFF.bias
  };
}

export function gameToWgs84(x: number, z: number): Wgs84 {
  const det = X_COEFF.lon * Z_COEFF.lat - X_COEFF.lat * Z_COEFF.lon;
  const bx = x - X_COEFF.bias;
  const bz = z - Z_COEFF.bias;
  const lon = (bx * Z_COEFF.lat - bz * X_COEFF.lat) / det;
  const lat = (X_COEFF.lon * bz - Z_COEFF.lon * bx) / det;
  return { lon, lat };
}

export const GEO_CONTROL_POINTS: Array<Wgs84 & GameXZ & { id: string }> = [
  { id: 'sf-ferry', lon: -122.3933, lat: 37.7955, x: -780, z: -520 },
  { id: 'gg-bridge', lon: -122.4783, lat: 37.8077, x: -1165, z: -455 },
  { id: 'oakland', lon: -122.2712, lat: 37.8044, x: 660, z: -200 },
  { id: 'sanjose', lon: -121.8949, lat: 37.3382, x: 260, z: -1560 }
];