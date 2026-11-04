import type { Handler } from "@netlify/functions";
import { lookupFlight } from "./_flight";
import { coords } from "./_pulse";

/** GET /api/flight?q=UA123&lat=..&lon=..&tz=.. → live flight position + arrival estimate (public ADS-B data). */
export const handler: Handler = async (event) => {
  const q = String(event.queryStringParameters?.q ?? "").slice(0, 40);
  const tz = String(event.queryStringParameters?.tz ?? "America/Los_Angeles");
  const { lat, lon } = coords(event.queryStringParameters);
  let zone = "America/Los_Angeles";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    zone = tz;
  } catch {
    /* keep default */
  }
  const result = await lookupFlight(q, zone, lat, lon);
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=20" },
    body: JSON.stringify(result),
  };
};
