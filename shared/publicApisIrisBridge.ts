/**
 * public-apis catalog — Iris hints (no live calls). Production APIs listed in tortuca-public-apis.json.
 */
export const PUBLIC_API_POLICY =
  "New catalog APIs need Netlify session proxy before Iris can use them; never put API keys in client or Iris memory.";

/** Short ask extra: what's wired vs backlog. */
export function publicApisContextForIris(): string {
  return [
    "Public APIs (curated index): Pulse already uses USGS, NWS, Open-Meteo air, ADSB.lol, Caltrans CCTV, wildfire GIS.",
    "Stocks use Finnhub via /api/stocks (session + FINNHUB_API_KEY).",
    "Revenue backlog from catalog: Seller Fee (payout math), Logoapi (thumbnail mocks) — proxy/client per tortuca-public-apis.json.",
    PUBLIC_API_POLICY,
  ].join(" ");
}