import type { Handler } from "@netlify/functions";
import { buildPulse, coords } from "./_pulse";

/** GET /api/pulse?lat=..&lon=.. → Bay Area Pulse snapshot (public data only). */
export const handler: Handler = async (event) => {
  const { lat, lon } = coords(event.queryStringParameters);
  const snapshot = await buildPulse(lat, lon);
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    body: JSON.stringify(snapshot),
  };
};
