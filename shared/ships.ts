/**
 * Ships in the Bay from AISStream (free key: AISSTREAM_API_KEY in Netlify).
 * AISStream is a WebSocket feed; netlify/functions/_ships.ts listens for a few
 * seconds and hands the raw messages here.
 */

export interface Ship {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  /** Speed over ground, knots. */
  speedKt?: number;
  /** Course over ground, degrees. */
  course?: number;
  status: "underway" | "anchored" | "moored" | "other";
  kind?: string;
  destination?: string;
}

/** San Francisco Bay, San Pablo Bay and the Carquinez Strait. [[south, west], [north, east]]. */
export const BAY_BOX: [[number, number], [number, number]] = [
  [37.4, -122.65],
  [38.2, -122.0],
];

const NAV_STATUS: Record<number, Ship["status"]> = { 0: "underway", 8: "underway", 1: "anchored", 5: "moored" };

/** AIS ship type number → plain word. */
export function shipKind(type: number): string | undefined {
  if (type >= 70 && type <= 79) return "Cargo";
  if (type >= 80 && type <= 89) return "Tanker";
  if (type >= 60 && type <= 69) return "Passenger";
  if (type === 52) return "Tug";
  if (type === 31 || type === 32) return "Towing";
  if (type === 30) return "Fishing";
  if (type === 35) return "Military";
  if (type === 36) return "Sailboat";
  if (type === 37) return "Pleasure craft";
  if (type === 50) return "Pilot boat";
  if (type === 51) return "Search & rescue";
  if (type === 55) return "Law enforcement";
  return undefined;
}

const num = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** Raw AISStream messages → one entry per vessel (latest position wins), moving ships first. */
export function parseAisMessages(messages: unknown[], limit = 60): Ship[] {
  const ships = new Map<string, Ship>();
  const statics = new Map<string, { kind?: string; destination?: string; name?: string }>();
  for (const raw of messages) {
    const m = raw as { MessageType?: string; MetaData?: Record<string, unknown>; Message?: Record<string, Record<string, unknown>> };
    const meta = m?.MetaData ?? {};
    const mmsi = String(meta.MMSI ?? "");
    if (!mmsi) continue;
    if (m.MessageType === "ShipStaticData") {
      const s = m.Message?.ShipStaticData ?? {};
      statics.set(mmsi, {
        kind: shipKind(Number(s.Type)),
        destination: String(s.Destination ?? "").replace(/@+/g, "").trim() || undefined,
        name: String(s.Name ?? "").replace(/@+/g, "").trim() || undefined,
      });
      continue;
    }
    if (m.MessageType !== "PositionReport") continue;
    const p = m.Message?.PositionReport ?? {};
    const lat = num(p.Latitude) ?? num(meta.latitude);
    const lon = num(p.Longitude) ?? num(meta.longitude);
    if (lat === undefined || lon === undefined || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    const sog = num(p.Sog);
    const cog = num(p.Cog);
    ships.set(mmsi, {
      mmsi,
      name: String(meta.ShipName ?? "").replace(/@+/g, "").trim() || `Vessel ${mmsi}`,
      lat,
      lon,
      speedKt: sog !== undefined && sog < 102.3 ? Math.round(sog * 10) / 10 : undefined,
      course: cog !== undefined && cog < 360 ? Math.round(cog) : undefined,
      status: NAV_STATUS[Number(p.NavigationalStatus)] ?? "other",
    });
  }
  for (const [mmsi, s] of statics) {
    const ship = ships.get(mmsi);
    if (!ship) continue;
    ship.kind = s.kind;
    ship.destination = s.destination;
    if (s.name && ship.name.startsWith("Vessel ")) ship.name = s.name;
  }
  return [...ships.values()]
    .sort((a, b) => (b.speedKt ?? 0) - (a.speedKt ?? 0))
    .slice(0, limit);
}
