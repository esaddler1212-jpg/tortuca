/**
 * Satellite passes (the ISS) over E's location, from a CelesTrak TLE.
 * A pass is "visible" when the station is sunlit while the sky at the
 * observer is dark (sun 6°+ below the horizon), the same rule NASA's
 * Spot the Station uses. Pure math here; fetching lives in netlify/functions.
 */
import { ecfToLookAngles, eciToEcf, gstime, propagate, twoline2satrec } from "satellite.js";
import { compass, type SkyPass } from "./skyText";

export * from "./skyText";

const DEG = 180 / Math.PI;
const SUN_KM = 149_597_870.7;
const EARTH_KM = 6371;

/** Unit vector to the Sun in Earth-centred inertial coordinates (low-precision almanac formula, ~0.01°). */
export function sunDirection(date: Date): { x: number; y: number; z: number } {
  const n = date.getTime() / 86_400_000 + 2440587.5 - 2451545.0;
  const L = (280.46 + 0.9856474 * n) / DEG;
  const g = (357.528 + 0.9856003 * n) / DEG;
  const lambda = L + (1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) / DEG;
  const eps = (23.439 - 0.0000004 * n) / DEG;
  return { x: Math.cos(lambda), y: Math.cos(eps) * Math.sin(lambda), z: Math.sin(eps) * Math.sin(lambda) };
}

/** Is a satellite (ECI km) in sunlight? Earth's shadow treated as a cylinder. */
export function sunlit(pos: { x: number; y: number; z: number }, sun: { x: number; y: number; z: number }): boolean {
  const along = pos.x * sun.x + pos.y * sun.y + pos.z * sun.z;
  if (along > 0) return true;
  const r2 = pos.x ** 2 + pos.y ** 2 + pos.z ** 2;
  return Math.sqrt(Math.max(0, r2 - along ** 2)) > EARTH_KM;
}

interface Sample {
  t: number;
  el: number;
  az: number;
  lit: boolean;
  darkSky: boolean;
}

/**
 * Passes above `minElevation` between `from` and `from + hours`.
 * Steps every 20 s (a pass lasts minutes), so it's cheap enough per request.
 */
export function issPasses(
  tle1: string,
  tle2: string,
  lat: number,
  lon: number,
  from: Date,
  hours = 48,
  minElevation = 10,
): SkyPass[] {
  const sat = twoline2satrec(tle1.trim(), tle2.trim());
  const observer = { latitude: lat / DEG, longitude: lon / DEG, height: 0.01 };
  const step = 20_000;
  const end = from.getTime() + hours * 3_600_000;
  const passes: SkyPass[] = [];
  let current: Sample[] = [];

  const close = () => {
    if (current.length < 2) {
      current = [];
      return;
    }
    const top = current.reduce((a, b) => (b.el > a.el ? b : a));
    if (top.el >= minElevation) {
      const seen = current.filter((s) => s.lit && s.darkSky && s.el >= minElevation);
      passes.push({
        start: new Date(current[0].t).toISOString(),
        peak: new Date(top.t).toISOString(),
        end: new Date(current[current.length - 1].t).toISOString(),
        maxElevation: Math.round(top.el),
        from: compass(current[0].az),
        peakDir: compass(top.az),
        to: compass(current[current.length - 1].az),
        visible: seen.length > 0,
        visibleMinutes: Math.round((seen.length * step) / 60_000),
      });
    }
    current = [];
  };

  for (let t = from.getTime(); t <= end; t += step) {
    const date = new Date(t);
    const pv = propagate(sat, date);
    if (!pv || typeof pv.position !== "object" || !pv.position) continue;
    const gmst = gstime(date);
    const look = ecfToLookAngles(observer, eciToEcf(pv.position, gmst));
    const el = look.elevation * DEG;
    if (el < 0) {
      close();
      continue;
    }
    const sun = sunDirection(date);
    const sunLook = ecfToLookAngles(observer, eciToEcf({ x: sun.x * SUN_KM, y: sun.y * SUN_KM, z: sun.z * SUN_KM }, gmst));
    current.push({
      t,
      el,
      az: look.azimuth * DEG,
      lit: sunlit(pv.position, sun),
      darkSky: sunLook.elevation * DEG < -6,
    });
  }
  close();
  return passes;
}

