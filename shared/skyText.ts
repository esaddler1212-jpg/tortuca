/**
 * ISS pass types and wording, shared by the server and the browser. The orbit
 * math (satellite.js) lives in shared/sky.ts and runs only on the server.
 */

export interface SkyPass {
  /** ISO times. */
  start: string;
  peak: string;
  end: string;
  /** Highest point above the horizon, degrees. */
  maxElevation: number;
  /** Compass directions it rises, peaks and sets in ("NW", "SE"…). */
  from: string;
  peakDir: string;
  to: string;
  /** Sunlit station + dark sky at some point during the pass. */
  visible: boolean;
  /** Minutes you can see it (0 if not visible). */
  visibleMinutes: number;
}

const DIRS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function compass(azimuthDeg: number): string {
  return DIRS[Math.round((((azimuthDeg % 360) + 360) % 360) / 45) % 8];
}

/** "Tonight 7:42 PM, NW → SE, 54° high, 5 min" style line for Iris and the card. */
export function describePass(p: SkyPass, timeZone: string, now = new Date()): string {
  const start = new Date(p.start);
  const time = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone });
  const dayFmt = (d: Date) => d.toLocaleDateString("en-US", { timeZone });
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const hour = Number(start.toLocaleString("en-US", { hour: "numeric", hourCycle: "h23", timeZone }));
  const day =
    dayFmt(start) === dayFmt(now)
      ? hour >= 17 ? "Tonight" : "Today"
      : dayFmt(start) === dayFmt(tomorrow)
        ? hour < 6 ? "Before dawn tomorrow" : hour >= 17 ? "Tomorrow night" : "Tomorrow"
        : start.toLocaleDateString("en-US", { weekday: "long", timeZone });
  const mins = p.visibleMinutes ? `, about ${p.visibleMinutes} min` : "";
  return `${day} ${time}, ${p.from} to ${p.to}, ${p.maxElevation}° high${mins}`;
}

/** The next pass you can actually see with your eyes, if any. */
export function nextVisible(passes: SkyPass[] | undefined, now = new Date()): SkyPass | null {
  return passes?.find((p) => p.visible && Date.parse(p.end) > now.getTime()) ?? null;
}

/** Context line for Iris: the next visible ISS passes. */
export function issContext(passes: SkyPass[] | undefined, timeZone: string, now = new Date()): string {
  if (!passes) return "";
  const seen = passes.filter((p) => p.visible && Date.parse(p.end) > now.getTime()).slice(0, 3);
  if (!seen.length) return "ISS: no passes you can see from here in the next two days.";
  return `ISS passes you can see: ${seen.map((p) => describePass(p, timeZone, now)).join("; ")}.`;
}
