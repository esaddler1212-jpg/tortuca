import { issPasses, type SkyPass } from "../../shared/sky";

const UA = "IRIS personal dashboard (alfred2.netlify.app)";

// ISS orbit data changes slowly; refresh every 6 hours.
let tleCache: { at: number; lines: [string, string] } | null = null;

async function issTle(): Promise<[string, string]> {
  if (tleCache && Date.now() - tleCache.at < 6 * 3_600_000) return tleCache.lines;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch("https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle", {
      signal: ctrl.signal,
      headers: { "User-Agent": UA },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const lines = (await res.text()).split(/\r?\n/).map((l) => l.trim());
    const l1 = lines.find((l) => l.startsWith("1 25544"));
    const l2 = lines.find((l) => l.startsWith("2 25544"));
    if (!l1 || !l2) throw new Error("No ISS TLE");
    tleCache = { at: Date.now(), lines: [l1, l2] };
    return tleCache.lines;
  } finally {
    clearTimeout(timer);
  }
}

/** ISS passes over the next two days for this spot. */
export async function issForecast(lat: number, lon: number, now = new Date()): Promise<SkyPass[]> {
  const [l1, l2] = await issTle();
  return issPasses(l1, l2, lat, lon, now, 48).slice(0, 8);
}
