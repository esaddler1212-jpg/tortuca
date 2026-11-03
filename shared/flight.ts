/**
 * "Iris, where's flight UA 123?": turn what E says into an ADS-B callsign,
 * read the live position from adsb.lol, and estimate the arrival time from
 * the route (adsb.lol routeset) and current ground speed.
 * Pure parsing here; fetching lives in netlify/functions/_flight.ts.
 */
import { milesBetween } from "./pulse";

/** Airline code people say (IATA) → the callsign prefix planes broadcast (ICAO). */
export const AIRLINES: Record<string, { icao: string; name: string }> = {
  UA: { icao: "UAL", name: "United" },
  AA: { icao: "AAL", name: "American" },
  DL: { icao: "DAL", name: "Delta" },
  WN: { icao: "SWA", name: "Southwest" },
  AS: { icao: "ASA", name: "Alaska" },
  B6: { icao: "JBU", name: "JetBlue" },
  NK: { icao: "NKS", name: "Spirit" },
  F9: { icao: "FFT", name: "Frontier" },
  HA: { icao: "HAL", name: "Hawaiian" },
  G4: { icao: "AAY", name: "Allegiant" },
  SY: { icao: "SCX", name: "Sun Country" },
  QX: { icao: "QXE", name: "Horizon" },
  OO: { icao: "SKW", name: "SkyWest" },
  MX: { icao: "MXY", name: "Breeze" },
  AC: { icao: "ACA", name: "Air Canada" },
  WS: { icao: "WJA", name: "WestJet" },
  AM: { icao: "AMX", name: "Aeroméxico" },
  Y4: { icao: "VOI", name: "Volaris" },
  BA: { icao: "BAW", name: "British Airways" },
  VS: { icao: "VIR", name: "Virgin Atlantic" },
  LH: { icao: "DLH", name: "Lufthansa" },
  AF: { icao: "AFR", name: "Air France" },
  KL: { icao: "KLM", name: "KLM" },
  EI: { icao: "EIN", name: "Aer Lingus" },
  IB: { icao: "IBE", name: "Iberia" },
  LX: { icao: "SWR", name: "Swiss" },
  TK: { icao: "THY", name: "Turkish" },
  EK: { icao: "UAE", name: "Emirates" },
  QR: { icao: "QTR", name: "Qatar" },
  EY: { icao: "ETD", name: "Etihad" },
  SQ: { icao: "SIA", name: "Singapore" },
  CX: { icao: "CPA", name: "Cathay Pacific" },
  JL: { icao: "JAL", name: "Japan Airlines" },
  NH: { icao: "ANA", name: "ANA" },
  KE: { icao: "KAL", name: "Korean Air" },
  OZ: { icao: "AAR", name: "Asiana" },
  BR: { icao: "EVA", name: "EVA Air" },
  CI: { icao: "CAL", name: "China Airlines" },
  QF: { icao: "QFA", name: "Qantas" },
  NZ: { icao: "ANZ", name: "Air New Zealand" },
  PR: { icao: "PAL", name: "Philippine" },
  FX: { icao: "FDX", name: "FedEx" },
  "5X": { icao: "UPS", name: "UPS" },
};

const ICAO_NAMES = new Map(Object.values(AIRLINES).map((a) => [a.icao, a.name]));

/**
 * "UA 123", "ua123", "United 123", "UAL123" → "UAL123".
 * A tail number like "N123AB" is passed through. Returns null if it can't be a flight.
 */
export function toCallsign(input: string): string | null {
  const raw = input.toUpperCase().replace(/\bFLIGHT\b/g, "").replace(/[^A-Z0-9 ]/g, "").trim();
  if (!raw) return null;
  // "United 123" → by airline name.
  const named = raw.match(/^([A-Z ]+?)\s*(\d{1,4}[A-Z]?)$/);
  if (named) {
    const word = named[1].trim();
    const hit = Object.values(AIRLINES).find((a) => a.name.toUpperCase() === word);
    if (hit) return `${hit.icao}${named[2]}`;
  }
  const compact = raw.replace(/\s+/g, "");
  if (/^N\d{1,5}[A-Z]{0,2}$/.test(compact)) return compact; // US tail number
  const icao = compact.match(/^([A-Z]{3})(\d{1,4}[A-Z]?)$/);
  if (icao) return `${icao[1]}${icao[2]}`;
  const iata = compact.match(/^([A-Z0-9]{2})(\d{1,4}[A-Z]?)$/);
  if (iata && AIRLINES[iata[1]]) return `${AIRLINES[iata[1]].icao}${iata[2]}`;
  return null;
}

export interface Airport {
  code: string;
  name: string;
  city?: string;
  lat?: number;
  lon?: number;
}

export interface FlightFix {
  callsign: string;
  airline?: string;
  hex: string;
  type?: string;
  registration?: string;
  lat: number;
  lon: number;
  altitudeFt?: number;
  onGround: boolean;
  speedKt?: number;
  track?: number;
  verticalFpm?: number;
  origin?: Airport;
  destination?: Airport;
  /** Miles still to fly and estimated landing time (ISO), from current speed. */
  milesToGo?: number;
  eta?: string;
  /** Seconds since the position was last heard. */
  seenSecondsAgo?: number;
}

const num = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** adsb.lol /v2/callsign/<cs> → the best match (freshest airborne position). */
export function parseCallsignResponse(json: unknown, callsign: string): FlightFix | null {
  const ac = ((json as { ac?: unknown[] })?.ac ?? []) as Record<string, unknown>[];
  const fixes = ac
    .filter((a) => num(a.lat) !== undefined && num(a.lon) !== undefined)
    .sort((a, b) => (num(a.seen_pos) ?? num(a.seen) ?? 999) - (num(b.seen_pos) ?? num(b.seen) ?? 999));
  const a = fixes[0];
  if (!a) return null;
  const cs = String(a.flight ?? callsign).trim() || callsign;
  return {
    callsign: cs,
    airline: ICAO_NAMES.get(cs.slice(0, 3)),
    hex: String(a.hex ?? ""),
    type: a.t ? String(a.t) : undefined,
    registration: a.r ? String(a.r) : undefined,
    lat: num(a.lat)!,
    lon: num(a.lon)!,
    altitudeFt: a.alt_baro === "ground" ? 0 : num(a.alt_baro) ?? num(a.alt_geom),
    onGround: a.alt_baro === "ground",
    speedKt: num(a.gs),
    track: num(a.track) ?? num(a.true_heading),
    verticalFpm: num(a.baro_rate) ?? num(a.geom_rate),
    seenSecondsAgo: num(a.seen_pos) ?? num(a.seen),
  };
}

function airport(a: Record<string, unknown> | undefined): Airport | undefined {
  if (!a) return undefined;
  const code = String(a.iata || a.icao || "").trim();
  if (!code) return undefined;
  return {
    code,
    name: String(a.name ?? code),
    city: a.location ? String(a.location) : undefined,
    lat: num(a.lat),
    lon: num(a.lon),
  };
}

/** adsb.lol /api/0/routeset → origin and destination (last leg of a multi-stop route). */
export function parseRoute(json: unknown): { origin?: Airport; destination?: Airport } {
  const row = (Array.isArray(json) ? json[0] : undefined) as Record<string, unknown> | undefined;
  if (!row || row.plausible === false || row.plausible === 0) return {};
  const ports = (Array.isArray(row._airports) ? row._airports : []) as Record<string, unknown>[];
  if (ports.length < 2) return {};
  return { origin: airport(ports[ports.length - 2]), destination: airport(ports[ports.length - 1]) };
}

/** Distance left and a rough landing time from current ground speed (+ ~10 min for the approach). */
export function withEta(fix: FlightFix, route: { origin?: Airport; destination?: Airport }, now = new Date()): FlightFix {
  const out: FlightFix = { ...fix, ...route };
  const d = route.destination;
  if (d?.lat === undefined || d.lon === undefined) return out;
  const miles = milesBetween(fix.lat, fix.lon, d.lat, d.lon);
  out.milesToGo = Math.round(miles);
  if (!fix.onGround && fix.speedKt && fix.speedKt > 80) {
    const mph = fix.speedKt * 1.15078;
    const minutes = (miles / mph) * 60 + (miles > 40 ? 10 : 3);
    out.eta = new Date(now.getTime() + minutes * 60_000).toISOString();
  }
  return out;
}

/** One or two spoken sentences for Iris. */
export function describeFlight(f: FlightFix, timeZone: string, nearLat?: number, nearLon?: number): string {
  const name = f.airline ? `${f.airline} ${f.callsign.slice(3)}` : f.callsign;
  const route = f.origin && f.destination ? ` from ${f.origin.city || f.origin.code} to ${f.destination.city || f.destination.code}` : "";
  if (f.onGround) return `${name}${route} is on the ground right now.`;
  const alt = f.altitudeFt ? `${Math.round(f.altitudeFt / 100) * 100} feet` : "unknown altitude";
  const trend = f.verticalFpm && Math.abs(f.verticalFpm) > 500 ? (f.verticalFpm > 0 ? ", climbing" : ", descending") : "";
  const speed = f.speedKt ? `, ${Math.round(f.speedKt * 1.15078)} mph` : "";
  const near =
    nearLat !== undefined && nearLon !== undefined ? `, about ${Math.round(milesBetween(nearLat, nearLon, f.lat, f.lon))} miles from you` : "";
  const eta = f.eta
    ? ` Estimated landing around ${new Date(f.eta).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone })}, ${f.milesToGo} miles to go.`
    : f.milesToGo !== undefined
      ? ` ${f.milesToGo} miles to go.`
      : "";
  return `${name}${route} is at ${alt}${trend}${speed}${near}.${eta}`;
}
