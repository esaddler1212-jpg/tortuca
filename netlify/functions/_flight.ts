import { describeFlight, parseCallsignResponse, parseRoute, toCallsign, withEta, type FlightFix } from "../../shared/flight";

const UA = "IRIS personal dashboard (alfred2.netlify.app)";

async function call(url: string, init: RequestInit = {}, timeoutMs = 6000): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "application/json", ...(init.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export type FlightLookup =
  | { ok: true; callsign: string; flight: FlightFix; spoken: string }
  | { ok: false; callsign: string | null; spoken: string };

/** Live position (adsb.lol) + route and arrival estimate for a flight E names. */
export async function lookupFlight(query: string, timeZone: string, nearLat?: number, nearLon?: number): Promise<FlightLookup> {
  const callsign = toCallsign(query);
  if (!callsign) {
    return { ok: false, callsign: null, spoken: `I couldn't turn "${query.slice(0, 40)}" into a flight number. Try something like UA 123.` };
  }
  let fix: FlightFix | null;
  try {
    const field = /^N\d/.test(callsign) ? "reg" : "callsign";
    fix = parseCallsignResponse(await call(`https://api.adsb.lol/v2/${field}/${encodeURIComponent(callsign)}`), callsign);
  } catch {
    return { ok: false, callsign, spoken: "The flight tracker isn't answering right now. Try again in a minute." };
  }
  if (!fix) {
    return {
      ok: false,
      callsign,
      spoken: `${callsign} isn't broadcasting right now. It may not have taken off yet, may have landed, or it's out of range of the volunteer receivers.`,
    };
  }
  let route = {};
  if (!/^N\d/.test(callsign)) {
    try {
      route = parseRoute(
        await call(
          "https://api.adsb.lol/api/0/routeset",
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planes: [{ callsign: fix.callsign, lat: fix.lat, lng: fix.lon }] }) },
          5000,
        ),
      );
    } catch {
      /* no route: position only */
    }
  }
  const flight = withEta(fix, route);
  return { ok: true, callsign, flight, spoken: describeFlight(flight, timeZone, nearLat, nearLon) };
}
