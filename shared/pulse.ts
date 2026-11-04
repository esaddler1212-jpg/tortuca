import type { SkyPass } from "./skyText";
import type { Ship } from "./ships";

/**
 * Bay Area Pulse: what's happening around you right now, from free public
 * feeds (the same keyless sources God's Eye View uses): USGS quakes, NWS
 * alerts, Open-Meteo air quality, NIFC wildfires, Caltrans cams, adsb.lol flights.
 * Pure parsing + alert rules here; fetching lives in netlify/functions/pulse.ts.
 */

export interface Quake {
  id: string;
  mag: number;
  place: string;
  time: string;
  miles: number;
  url: string;
  lat?: number;
  lon?: number;
}
export interface WeatherAlert {
  id: string;
  event: string;
  severity: string;
  headline: string;
  ends?: string;
}
export interface Air {
  aqi: number;
  pm25?: number;
  label: string;
  level: "good" | "moderate" | "sensitive" | "unhealthy" | "very" | "hazardous";
}
export interface Fire {
  id: string;
  name: string;
  acres?: number;
  contained?: number;
  discovered?: string;
  miles: number;
  lat?: number;
  lon?: number;
}
export interface Cam {
  id: string;
  name: string;
  route: string;
  image: string;
  miles: number;
  lat?: number;
  lon?: number;
}
export interface Flight {
  hex: string;
  callsign: string;
  type?: string;
  altitudeFt?: number;
  miles: number;
  lat?: number;
  lon?: number;
  /** Heading over the ground, degrees (rotates the plane on the map). */
  track?: number;
  speedKt?: number;
}
export interface PulseSnapshot {
  fetchedAt: string;
  quakes: Quake[];
  alerts: WeatherAlert[];
  air: Air | null;
  fires: Fire[];
  cams: Cam[];
  /** `all` (up to 40) is for the map; `nearest` for the list. */
  flights: { count: number; nearest: Flight[]; all?: Flight[] } | null;
  /** ISS passes over the next two days (see shared/sky.ts). */
  iss?: SkyPass[];
  /** Ships in the Bay; null when the feed failed, undefined when no AISStream key is set. */
  ships?: Ship[] | null;
  /** Sources that failed this time (shown quietly, never breaks the card). */
  unavailable: string[];
}

// ── Geometry ─────────────────────────────────────────────────────────────

export function milesBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(a));
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// ── Parsers (each tolerant of missing fields) ────────────────────────────

/** USGS FDSN GeoJSON → quakes, nearest-first within the query radius. */
export function parseQuakes(json: unknown, lat: number, lon: number): Quake[] {
  const features = (json as { features?: unknown[] })?.features ?? [];
  const out: Quake[] = [];
  for (const f of features as { id?: string; properties?: Record<string, unknown>; geometry?: { coordinates?: number[] } }[]) {
    const p = f.properties ?? {};
    const [qLon, qLat] = f.geometry?.coordinates ?? [];
    const mag = Number(p.mag);
    if (!f.id || !Number.isFinite(mag) || !Number.isFinite(qLat) || !Number.isFinite(qLon)) continue;
    out.push({
      id: f.id,
      mag: round1(mag),
      place: String(p.place ?? "Unknown location"),
      time: new Date(Number(p.time)).toISOString(),
      miles: Math.round(milesBetween(lat, lon, qLat, qLon)),
      lat: qLat,
      lon: qLon,
      url: String(p.url ?? `https://earthquake.usgs.gov/earthquakes/eventpage/${f.id}`),
    });
  }
  return out.sort((a, b) => b.time.localeCompare(a.time));
}

/** api.weather.gov /alerts/active?point= → active alerts. */
export function parseWeatherAlerts(json: unknown): WeatherAlert[] {
  const features = (json as { features?: unknown[] })?.features ?? [];
  return (features as { id?: string; properties?: Record<string, unknown> }[])
    .map((f) => {
      const p = f.properties ?? {};
      return {
        id: String(p.id ?? f.id ?? ""),
        event: String(p.event ?? "Alert"),
        severity: String(p.severity ?? "Unknown"),
        headline: String(p.headline ?? p.event ?? ""),
        ends: (p.ends ?? p.expires) ? String(p.ends ?? p.expires) : undefined,
      };
    })
    .filter((a) => a.id);
}

/** US AQI → plain-language level (EPA bands). */
export function aqiLevel(aqi: number): Pick<Air, "label" | "level"> {
  if (aqi <= 50) return { label: "Good", level: "good" };
  if (aqi <= 100) return { label: "Moderate", level: "moderate" };
  if (aqi <= 150) return { label: "Unhealthy for sensitive groups", level: "sensitive" };
  if (aqi <= 200) return { label: "Unhealthy", level: "unhealthy" };
  if (aqi <= 300) return { label: "Very unhealthy", level: "very" };
  return { label: "Hazardous", level: "hazardous" };
}

/** Open-Meteo air-quality `current` → AQI. */
export function parseAir(json: unknown): Air | null {
  const cur = (json as { current?: Record<string, unknown> })?.current;
  const aqi = Number(cur?.us_aqi);
  if (!Number.isFinite(aqi)) return null;
  const pm = Number(cur?.pm2_5);
  return { aqi: Math.round(aqi), pm25: Number.isFinite(pm) ? round1(pm) : undefined, ...aqiLevel(aqi) };
}

/** NIFC WFIGS incident points (ArcGIS JSON) → wildfires, nearest first. */
export function parseFires(json: unknown, lat: number, lon: number): Fire[] {
  const features = (json as { features?: unknown[] })?.features ?? [];
  const out: Fire[] = [];
  for (const f of features as { attributes?: Record<string, unknown>; geometry?: { x?: number; y?: number } }[]) {
    const a = f.attributes ?? {};
    const fy = Number(f.geometry?.y);
    const fx = Number(f.geometry?.x);
    if (!Number.isFinite(fy) || !Number.isFinite(fx)) continue;
    const category = String(a.IncidentTypeCategory ?? "WF");
    if (category && category !== "WF") continue; // wildfires only (skip prescribed burns)
    const name = String(a.IncidentName ?? "Unnamed fire").trim();
    const acres = Number(a.IncidentSize);
    const contained = Number(a.PercentContained);
    const disc = Number(a.FireDiscoveryDateTime);
    out.push({
      id: String(a.UniqueFireIdentifier ?? a.IrwinID ?? name),
      name: /fire$/i.test(name) ? name : `${name} Fire`,
      acres: Number.isFinite(acres) ? Math.round(acres) : undefined,
      contained: Number.isFinite(contained) ? Math.round(contained) : undefined,
      discovered: Number.isFinite(disc) ? new Date(disc).toISOString() : undefined,
      miles: Math.round(milesBetween(lat, lon, fy, fx)),
      lat: fy,
      lon: fx,
    });
  }
  return out.sort((a, b) => a.miles - b.miles);
}

/** Routes worth watching around Vallejo / the North Bay commute. */
export const COMMUTE_ROUTES = /\b(I-80|I-780|I-680|SR-37|SR-29|I-580|SR-4|SR-12)\b/;

/** Caltrans cctvStatusD04.json → nearest in-service commute cams. */
export function parseCams(json: unknown, lat: number, lon: number, limit = 6, maxMiles = 15): Cam[] {
  const rows = (json as { data?: unknown[] })?.data ?? [];
  const out: Cam[] = [];
  for (const row of rows as { cctv?: Record<string, unknown> }[]) {
    const c = row?.cctv as
      | { inService?: unknown; location?: Record<string, unknown>; imageData?: { static?: { currentImageURL?: string } } }
      | undefined;
    if (!c || String(c.inService).toLowerCase() !== "true") continue;
    const loc = c.location ?? {};
    const cLat = Number(loc.latitude);
    const cLon = Number(loc.longitude);
    const image = c.imageData?.static?.currentImageURL;
    if (!Number.isFinite(cLat) || !Number.isFinite(cLon) || !image?.startsWith("https://cwwp2.dot.ca.gov/")) continue;
    const locationName = String(loc.locationName ?? "");
    const routeText = `${String(loc.route ?? "")} ${locationName}`;
    const route = routeText.match(COMMUTE_ROUTES)?.[1];
    if (!route) continue;
    const miles = milesBetween(lat, lon, cLat, cLon);
    if (miles > maxMiles) continue;
    // "TV999 -- I-80 : Magazine St" → "Magazine St" (route is shown separately).
    const label = locationName.replace(/^[A-Za-z0-9_-]+\s*--\s*/, "").replace(/^[^:]*:\s*/, "").trim() || route;
    out.push({ id: image, name: label, route, image, miles: round1(miles), lat: cLat, lon: cLon });
  }
  return out.sort((a, b) => a.miles - b.miles).slice(0, limit);
}

/** adsb.lol /v2/lat/../lon/../dist/.. → overhead aircraft, nearest first. */
export function parseFlights(json: unknown, lat: number, lon: number, limit = 5): { count: number; nearest: Flight[]; all: Flight[] } {
  const ac = ((json as { ac?: unknown[] })?.ac ?? []) as Record<string, unknown>[];
  const airborne: Flight[] = [];
  for (const a of ac) {
    const fLat = Number(a.lat);
    const fLon = Number(a.lon);
    if (!Number.isFinite(fLat) || !Number.isFinite(fLon) || a.alt_baro === "ground") continue;
    const alt = Number(a.alt_baro);
    const track = Number(a.track ?? a.true_heading);
    const gs = Number(a.gs);
    airborne.push({
      hex: String(a.hex ?? ""),
      callsign: String(a.flight ?? a.r ?? a.hex ?? "").trim() || "Unknown",
      type: a.t ? String(a.t) : undefined,
      altitudeFt: Number.isFinite(alt) ? Math.round(alt) : undefined,
      miles: round1(milesBetween(lat, lon, fLat, fLon)),
      lat: fLat,
      lon: fLon,
      track: Number.isFinite(track) ? Math.round(track) : undefined,
      speedKt: Number.isFinite(gs) ? Math.round(gs) : undefined,
    });
  }
  airborne.sort((x, y) => x.miles - y.miles);
  return { count: airborne.length, nearest: airborne.slice(0, limit), all: airborne.slice(0, 40) };
}

// ── What deserves a push notification ────────────────────────────────────

/** NWS alert types worth interrupting for (besides anything Severe/Extreme). */
const NOTIFY_EVENTS = /red flag|heat|wind|flood|air quality|smoke|tsunami|earthquake|evacuat|fire|freeze|storm/i;

export interface PulseAlert {
  id: string;
  text: string;
}

/**
 * Alerts to push: a felt-size quake nearby in the last 2 hours, a wildfire
 * within 30 miles, a serious NWS alert, or unhealthy air. Each id is pushed once.
 */
export function pulseAlerts(s: PulseSnapshot, now: Date, day: string): PulseAlert[] {
  const out: PulseAlert[] = [];
  for (const q of s.quakes) {
    const ageMin = (now.getTime() - Date.parse(q.time)) / 60_000;
    if (q.mag >= 3.0 && q.miles <= 40 && ageMin <= 120) {
      out.push({ id: `q:${q.id}`, text: `M${q.mag} quake ${q.miles} mi away (${q.place})` });
    }
  }
  for (const f of s.fires) {
    if (f.miles <= 30) {
      out.push({
        id: `f:${f.id}`,
        text: `${f.name} ${f.miles} mi away${f.acres ? `, ${f.acres.toLocaleString("en-US")} acres` : ""}${f.contained !== undefined ? `, ${f.contained}% contained` : ""}`,
      });
    }
  }
  for (const a of s.alerts) {
    if (/severe|extreme/i.test(a.severity) || NOTIFY_EVENTS.test(a.event)) out.push({ id: `w:${a.id}`, text: a.event });
  }
  if (s.air && s.air.aqi > 150) out.push({ id: `a:${day}`, text: `Air quality ${s.air.label.toLowerCase()} (AQI ${s.air.aqi})` });
  return out;
}

/** One-line summary for the compact card and Brief me. */
export function pulseSummary(s: PulseSnapshot): string {
  const parts: string[] = [];
  if (s.alerts.length) parts.push(s.alerts.map((a) => a.event).slice(0, 2).join(", "));
  if (s.air) parts.push(`AQI ${s.air.aqi} ${s.air.label.toLowerCase()}`);
  const nearFire = s.fires.find((f) => f.miles <= 50);
  if (nearFire) parts.push(`${nearFire.name} ${nearFire.miles} mi`);
  const recentQuake = s.quakes[0];
  if (recentQuake && recentQuake.mag >= 3) parts.push(`M${recentQuake.mag} quake ${recentQuake.miles} mi`);
  if (!s.alerts.length && !nearFire) parts.push("no alerts");
  return parts.join(" · ");
}
