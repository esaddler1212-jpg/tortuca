import { LANDMARK_STREET_ROUTES, pointsForLandmarks } from './city-map-registry';
import { hillOffsetM } from './bay-terrain';
import { bearingDeg } from './landmark-navigation';
import { LANDMARKS, type LandmarkDef } from './landmark-registry';
import { GAS_STATIONS } from './gas-stations';
import type { StreetPoint } from './street-registry';
import type { ScenicRouteDef } from './world-extras';

export type NavPoint = { x: number; z: number };

function dist2(px: number, pz: number, x: number, z: number): number {
  return (px - x) ** 2 + (pz - z) ** 2;
}

function nearestIndexOnPolyline(px: number, pz: number, pts: StreetPoint[]): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const d = dist2(px, pz, pts[i]!.x, pts[i]!.z);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function forwardWaypoints(
  pts: StreetPoint[],
  fromIdx: number,
  toIdx: number,
  ring: boolean
): NavPoint[] {
  const out: NavPoint[] = [];
  if (fromIdx === toIdx) return [{ x: pts[toIdx]!.x, z: pts[toIdx]!.z }];
  let i = fromIdx;
  let guard = 0;
  while (i !== toIdx && guard < pts.length + 2) {
    out.push({ x: pts[i]!.x, z: pts[i]!.z });
    guard++;
    if (ring) i = (i + 1) % pts.length;
    else {
      if (toIdx > fromIdx) i++;
      else i--;
      if (i < 0 || i >= pts.length) break;
    }
  }
  out.push({ x: pts[toIdx]!.x, z: pts[toIdx]!.z });
  return out;
}

/** Street-following route toward next landmark (EarthNG-style nav, compressed map). */
export function routeWaypointsToPoint(px: number, pz: number, tx: number, tz: number): NavPoint[] {
  let anchor: LandmarkDef | null = null;
  let bestD = Infinity;
  for (const lm of LANDMARKS) {
    const d = dist2(tx, tz, lm.x, lm.z);
    if (d < bestD) {
      bestD = d;
      anchor = lm;
    }
  }
  if (anchor && bestD < 140) {
    const viaStreet = routeWaypointsToLandmark(px, pz, anchor);
    const last = viaStreet[viaStreet.length - 1]!;
    if (dist2(last.x, last.z, tx, tz) > 45 ** 2) viaStreet.push({ x: tx, z: tz });
    return viaStreet;
  }
  return [{ x: px, z: pz }, { x: tx, z: tz }];
}

export function routeWaypointsToLandmark(px: number, pz: number, lm: LandmarkDef): NavPoint[] {
  const route = LANDMARK_STREET_ROUTES.find((r) => r.landmarkIds.includes(lm.id));
  if (!route) return [{ x: px, z: pz }, { x: lm.x, z: lm.z }];
  const pts = pointsForLandmarks(route.landmarkIds);
  const toIdx = route.landmarkIds.indexOf(lm.id);
  const fromIdx = nearestIndexOnPolyline(px, pz, pts);
  const path = forwardWaypoints(pts, fromIdx, toIdx, Boolean(route.ring));
  return [{ x: px, z: pz }, ...path];
}

function normalizeAngle(deg: number): number {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a < -180) a += 360;
  return a;
}

function gradeAlongLeg(px: number, pz: number, legX: number, legZ: number): string | null {
  const horiz = Math.hypot(legX - px, legZ - pz);
  if (horiz < 25) return null;
  const y0 = hillOffsetM(px, pz);
  const y1 = hillOffsetM(legX, legZ);
  const pct = ((y1 - y0) / horiz) * 100;
  if (pct >= 4.5) return `Climb ${pct.toFixed(0)}%`;
  if (pct <= -4.5) return `Descent ${Math.abs(pct).toFixed(0)}%`;
  return null;
}

/** Turn hint for HUD — compare heading to next nav leg. */
export function navTurnHint(px: number, pz: number, yawDeg: number, route: NavPoint[]): string {
  if (route.length < 2) return 'Navigate';
  const leg =
    route.find((p, i) => i > 0 && dist2(px, pz, p.x, p.z) > 80 ** 2) ?? route[1]!;
  const brg = bearingDeg(px, pz, leg.x, leg.z);
  const delta = normalizeAngle(brg - yawDeg);
  const dist = Math.hypot(leg.x - px, leg.z - pz);
  const mi = ((dist / 1000) * 0.62).toFixed(1);
  const grade = gradeAlongLeg(px, pz, leg.x, leg.z);
  const turn =
    Math.abs(delta) < 18 ? `Continue ${mi} mi` : delta > 0 ? `Bear right · ${mi} mi` : `Bear left · ${mi} mi`;
  return grade ? `${turn} · ${grade}` : turn;
}

export function routeWaypointsForScenic(px: number, pz: number, route: ScenicRouteDef): NavPoint[] {
  let start = 0;
  let bestD = Infinity;
  route.points.forEach((p, i) => {
    const d = dist2(px, pz, p.x, p.z);
    if (d < bestD) {
      bestD = d;
      start = i;
    }
  });
  const out: NavPoint[] = [{ x: px, z: pz }];
  for (let i = start; i < route.points.length; i++) {
    out.push(route.points[i]!);
  }
  return out;
}

/** Nearest pump on the map (for low-fuel mission hints). */
export function nearestGasStationAnywhere(px: number, pz: number): (typeof GAS_STATIONS)[number] | null {
  let best: (typeof GAS_STATIONS)[number] | null = null;
  let bestD = Infinity;
  for (const g of GAS_STATIONS) {
    const d = Math.hypot(px - g.x, pz - g.z);
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  return best;
}
