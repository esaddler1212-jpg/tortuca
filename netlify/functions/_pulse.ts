import {
  parseAir,
  parseCams,
  parseFires,
  parseFlights,
  parseQuakes,
  parseWeatherAlerts,
  type PulseSnapshot,
} from "../../shared/pulse";
import { issForecast } from "./_sky";
import { bayShips } from "./_ships";

const UA = "IRIS personal dashboard (alfred2.netlify.app)";

async function getJson(url: string, timeoutMs = 8000, headers: Record<string, string> = {}): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA, Accept: "application/json", ...headers } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// The Caltrans district file is large and changes slowly: keep it for an hour.
let camCache: { at: number; json: unknown } | null = null;
async function caltransD4(): Promise<unknown> {
  if (camCache && Date.now() - camCache.at < 3_600_000) return camCache.json;
  const json = await getJson("https://cwwp2.dot.ca.gov/data/d4/cctv/cctvStatusD04.json", 10_000);
  camCache = { at: Date.now(), json };
  return json;
}

/** Fetch every feed in parallel; each failure is recorded, never thrown. */
export async function buildPulse(
  lat: number,
  lon: number,
  opts: { cams?: boolean; flights?: boolean; sky?: boolean; ships?: boolean } = {},
): Promise<PulseSnapshot> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const la = lat.toFixed(4);
  const lo = lon.toFixed(4);
  const unavailable: string[] = [];
  const attempt = async <T,>(name: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch {
      unavailable.push(name);
      return fallback;
    }
  };

  const [quakes, alerts, air, fires, cams, flights, iss, ships] = await Promise.all([
    attempt(
      "Earthquakes",
      async () =>
        parseQuakes(
          await getJson(
            `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${la}&longitude=${lo}&maxradiuskm=120&minmagnitude=2.5&starttime=${since}&orderby=time&limit=8`,
          ),
          lat,
          lon,
        ),
      [],
    ),
    attempt(
      "Weather alerts",
      async () => parseWeatherAlerts(await getJson(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`, 8000, { Accept: "application/geo+json" })),
      [],
    ),
    attempt(
      "Air quality",
      async () => parseAir(await getJson(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${la}&longitude=${lo}&current=us_aqi,pm2_5`)),
      null,
    ),
    attempt(
      "Wildfires",
      async () =>
        parseFires(
          await getJson(
            "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?" +
              new URLSearchParams({
                where: "1=1",
                geometry: `${lo},${la}`,
                geometryType: "esriGeometryPoint",
                inSR: "4326",
                outSR: "4326",
                distance: "75",
                units: "esriSRUnit_StatuteMile",
                outFields: "IncidentName,IncidentSize,PercentContained,FireDiscoveryDateTime,IncidentTypeCategory,UniqueFireIdentifier",
                returnGeometry: "true",
                f: "json",
              }),
          ),
          lat,
          lon,
        ).slice(0, 5),
      [],
    ),
    opts.cams === false ? Promise.resolve([]) : attempt("Traffic cams", async () => parseCams(await caltransD4(), lat, lon), []),
    opts.flights === false
      ? Promise.resolve(null)
      : attempt("Flights", async () => parseFlights(await getJson(`https://api.adsb.lol/v2/lat/${lat.toFixed(3)}/lon/${lon.toFixed(3)}/dist/22`), lat, lon), null),
    opts.sky === false ? Promise.resolve(undefined) : attempt("ISS passes", () => issForecast(lat, lon), undefined),
    opts.ships === false ? Promise.resolve(undefined) : attempt("Ships", () => bayShips(), null),
  ]);

  return { fetchedAt: new Date().toISOString(), quakes, alerts, air, fires, cams, flights, iss, ships, unavailable };
}

/** Accept only real coordinates (defaults to Vallejo). */
export function coords(q: Record<string, string | undefined> | null | undefined): { lat: number; lon: number } {
  const lat = Number(q?.lat);
  const lon = Number(q?.lon);
  const ok = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  return ok ? { lat, lon } : { lat: 38.1041, lon: -122.2566 };
}
