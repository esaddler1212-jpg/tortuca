import { useState } from "react";
import { Activity, AlertTriangle, Camera, ChevronDown, ChevronUp, Flame, Plane, Waves, Wind, X } from "lucide-react";
import { pulseSummary, type PulseSnapshot } from "../../shared/pulse";

const AQI_COLOR: Record<string, string> = {
  good: "text-emerald-300",
  moderate: "text-yellow-200",
  sensitive: "text-amber-300",
  unhealthy: "text-orange-400",
  very: "text-red-400",
  hazardous: "text-red-500",
};

function ago(iso?: string): string {
  if (!iso) return "";
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

interface Props {
  pulse: PulseSnapshot | null;
  error: boolean;
  city: string;
  /** Start open (Vantage) or as a one-line strip (workdays). */
  defaultOpen?: boolean;
}

/** Bay Area Pulse: alerts, air, fires, quakes, commute cams, flights overhead. */
export function PulsePanel({ pulse, error, city, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [cam, setCam] = useState<string | null>(null);
  const urgent = Boolean(pulse && (pulse.alerts.length || (pulse.air && pulse.air.aqi > 100) || pulse.fires.some((f) => f.miles <= 30)));

  return (
    <section className={`panel-hud p-4 ${urgent ? "!border-amber-400/50" : ""}`} aria-label="Bay Area Pulse">
      <button type="button" className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="min-w-0">
          <span className="hud-label flex items-center gap-1.5">
            {urgent ? <AlertTriangle className="h-3.5 w-3.5 text-amber-300" aria-hidden /> : <Activity className="h-3.5 w-3.5" aria-hidden />} Bay Area Pulse
          </span>
          <span className={`mt-0.5 block truncate text-xs ${urgent ? "text-amber-200" : "text-alfred-mist"}`}>
            {pulse ? pulseSummary(pulse) : error ? "Pulse unavailable right now" : "Checking the area…"}
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-alfred-mist" /> : <ChevronDown className="h-4 w-4 shrink-0 text-alfred-mist" />}
      </button>

      {open && pulse && (
        <div className="mt-4 space-y-4">
          {pulse.alerts.length > 0 && (
            <ul className="space-y-1.5">
              {pulse.alerts.map((a) => (
                <li key={a.id} className="rounded-md border border-amber-400/50 px-3 py-2 text-sm text-amber-100">
                  <p className="font-medium">{a.event}</p>
                  <p className="text-xs text-amber-200/80">{a.headline}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="hud-tile">
              <p className="flex items-center gap-1 font-mono text-[10px] uppercase text-alfred-mist">
                <Wind className="h-3 w-3" aria-hidden /> Air · {city}
              </p>
              {pulse.air ? (
                <>
                  <p className={`font-mono text-lg ${AQI_COLOR[pulse.air.level]}`}>AQI {pulse.air.aqi}</p>
                  <p className="text-[11px] text-alfred-mist">{pulse.air.label}</p>
                </>
              ) : (
                <p className="text-xs text-alfred-mist">No reading</p>
              )}
            </div>
            <div className="hud-tile">
              <p className="flex items-center gap-1 font-mono text-[10px] uppercase text-alfred-mist">
                <Plane className="h-3 w-3" aria-hidden /> Overhead now
              </p>
              {pulse.flights ? (
                <>
                  <p className="font-mono text-lg">{pulse.flights.count}</p>
                  <p className="text-[11px] text-alfred-mist">aircraft within 25 mi</p>
                </>
              ) : (
                <p className="text-xs text-alfred-mist">No data</p>
              )}
            </div>
          </div>

          <div>
            <p className="hud-label mb-1.5 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" aria-hidden /> Wildfires (75 mi)
            </p>
            {pulse.fires.length ? (
              <ul className="space-y-1 text-sm">
                {pulse.fires.map((f) => (
                  <li key={f.id} className="flex justify-between gap-2">
                    <span className={f.miles <= 30 ? "text-amber-200" : ""}>{f.name}</span>
                    <span className="shrink-0 font-mono text-xs text-alfred-mist">
                      {f.miles} mi{f.acres ? ` · ${f.acres.toLocaleString("en-US")} ac` : ""}
                      {f.contained !== undefined ? ` · ${f.contained}%` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-alfred-mist">No active wildfires nearby.</p>
            )}
          </div>

          <div>
            <p className="hud-label mb-1.5 flex items-center gap-1.5">
              <Waves className="h-3.5 w-3.5" aria-hidden /> Quakes (past week)
            </p>
            {pulse.quakes.length ? (
              <ul className="space-y-1 text-sm">
                {pulse.quakes.slice(0, 4).map((q) => (
                  <li key={q.id}>
                    <a href={q.url} target="_blank" rel="noreferrer" className="flex justify-between gap-2 hover:text-alfred-gold">
                      <span className="truncate">
                        <span className={`font-mono ${q.mag >= 3.5 ? "text-amber-200" : ""}`}>M{q.mag}</span> {q.place}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-alfred-mist">{ago(q.time)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-alfred-mist">Quiet. Nothing M2.5+ within 75 mi.</p>
            )}
          </div>

          {pulse.cams.length > 0 && (
            <div>
              <p className="hud-label mb-1.5 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" aria-hidden /> Commute cams
              </p>
              <div className="grid grid-cols-3 gap-2">
                {pulse.cams.map((c) => (
                  <button key={c.id} type="button" className="text-left" onClick={() => setCam(c.image)} aria-label={`Open camera: ${c.name}`}>
                    <img src={c.image} alt="" loading="lazy" className="aspect-video w-full rounded border border-alfred-border/60 object-cover" />
                    <p className="mt-0.5 truncate text-[10px] text-alfred-mist">
                      {c.route} · {c.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {pulse.flights && pulse.flights.nearest.length > 0 && (
            <div>
              <p className="hud-label mb-1.5 flex items-center gap-1.5">
                <Plane className="h-3.5 w-3.5" aria-hidden /> Closest flights
              </p>
              <ul className="space-y-1 text-sm">
                {pulse.flights.nearest.map((f) => (
                  <li key={f.hex}>
                    <a href={`https://globe.adsb.lol/?icao=${encodeURIComponent(f.hex)}`} target="_blank" rel="noreferrer" className="flex justify-between gap-2 hover:text-alfred-gold">
                      <span className="font-mono">
                        {f.callsign}
                        {f.type ? <span className="text-alfred-mist"> · {f.type}</span> : null}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-alfred-mist">
                        {f.altitudeFt !== undefined ? `${f.altitudeFt.toLocaleString("en-US")} ft · ` : ""}
                        {f.miles} mi
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-alfred-mist">
            Updated {ago(pulse.fetchedAt)} · USGS · NWS · Open-Meteo · NIFC · Caltrans · adsb.lol
            {pulse.unavailable.length ? ` · unavailable: ${pulse.unavailable.join(", ")}` : ""}
          </p>
        </div>
      )}

      {cam && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-3" role="dialog" aria-modal aria-label="Traffic camera" onClick={() => setCam(null)}>
          <img src={cam} alt="Live traffic camera" className="max-h-[80vh] w-full max-w-xl rounded border border-alfred-border/60" />
          <button type="button" className="btn-ghost absolute right-4 top-4 p-2" onClick={() => setCam(null)} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}
