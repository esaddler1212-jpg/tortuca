import type { NextRequest } from "next/server";

/** ISO 3166-1 alpha-2 country code from Netlify / CDN headers. */
export function getViewerCountry(request: NextRequest): string | null {
  const country =
    request.headers.get("x-nf-geo-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-vercel-ip-country");
  if (!country || country === "XX" || country === "T1") return null;
  return country.toUpperCase();
}

export function isCountryAllowed(
  allowed: string[] | null | undefined,
  viewerCountry: string | null,
): boolean {
  if (!allowed || allowed.length === 0) return true;
  if (!viewerCountry) return true;
  return allowed.map((c) => c.toUpperCase()).includes(viewerCountry);
}
