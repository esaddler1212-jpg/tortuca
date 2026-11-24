#!/usr/bin/env node
import { GEO_CONTROL_POINTS, wgs84ToGame } from '../drive-world/src/geo-anchor.ts';

const maxErrM = 2500;
const errors: string[] = [];

for (const cp of GEO_CONTROL_POINTS) {
  const mapped = wgs84ToGame(cp.lon, cp.lat);
  const dx = mapped.x - cp.x;
  const dz = mapped.z - cp.z;
  const err = Math.hypot(dx, dz);
  if (err > maxErrM) {
    errors.push(`${cp.id}: ${err.toFixed(0)} m error (max ${maxErrM})`);
  }
}

if (errors.length) {
  console.error('check-geo-anchor failed:\n' + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(`check-geo-anchor ok (${GEO_CONTROL_POINTS.length} control points)`);