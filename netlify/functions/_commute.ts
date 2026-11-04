import type { LiveCommute } from "../../shared/commute";

/**
 * Drive time with live traffic from Google. Tries the Routes API first (what
 * new Google Cloud projects get), then the older Distance Matrix API.
 * Needs GOOGLE_MAPS_API_KEY in Netlify; returns null without it.
 */
export async function googleCommute(origin: string, destination: string): Promise<LiveCommute | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key || !origin.trim() || !destination.trim()) return null;
  const timed = async (url: string, init?: RequestInit) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      return await fetch(url, { ...init, signal: ctrl.signal });
    } finally {
      clearTimeout(t);
    }
  };

  try {
    const res = await timed("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { routes?: { duration?: string }[] };
      const seconds = Number(String(data.routes?.[0]?.duration ?? "").replace(/s$/, ""));
      if (Number.isFinite(seconds) && seconds > 0) {
        const minutes = Math.max(1, Math.ceil(seconds / 60));
        return { minutes, text: `${minutes} min`, fetchedAt: new Date().toISOString() };
      }
    }
  } catch {
    /* try the older API */
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", origin);
    url.searchParams.set("destinations", destination);
    url.searchParams.set("mode", "driving");
    url.searchParams.set("departure_time", "now");
    url.searchParams.set("key", key);
    const res = await timed(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as {
      rows?: { elements?: { status: string; duration?: { value: number }; duration_in_traffic?: { value: number; text: string } }[] }[];
    };
    const el = data.rows?.[0]?.elements?.[0];
    const secs = el?.duration_in_traffic?.value ?? el?.duration?.value;
    if (!el || el.status !== "OK" || !secs) return null;
    const minutes = Math.max(1, Math.ceil(secs / 60));
    return { minutes, text: el.duration_in_traffic?.text ?? `${minutes} min`, fetchedAt: new Date().toISOString() };
  } catch {
    return null;
  }
}
