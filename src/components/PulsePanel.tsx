import { lazy, Suspense, useState, type FormEvent } from "react";
import { Activity, AlertTriangle, Camera, ChevronDown, ChevronUp, ExternalLink, Flame, Globe2, List, Map as MapIcon, Plane, Satellite, Search, Ship, Waves, Wind, X } from "lucide-react";
import { pulseSummary, type PulseSnapshot } from "../../shared/pulse";
import { describePass, nextVisible } from "../../shared/skyText";
import type { FlightFix } from "../../shared/flight";
import type { MapLayer } from "./PulseMap";
import { GODS_EYE_DEFAULT, loadGodsEyeUrl, normalizeGodsEyeUrl, saveGodsEyeUrl } from "../../shared/godsEye";

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

const PulseMap = lazy(() => import("./PulseMap"));

const VIEW_KEY = "iris-pulse-view";
const LAYER_LABELS: [MapLayer, string][] = [
  ["planes", "Planes"],
  ["quakes", "Quakes"],
  ["fires", "Fires"],
  ["cams", "Cams"],
  ["ships", "Ships"],
];

function loadView(): "list" | "map" {
  try {
    return localStorage.getItem(VIEW_KEY) === "map" ? "map" : "list";
  } catch {
    return "list";
  }
}

type FlightResult = { ok: true; flight: FlightFix; spoken: string } | { ok: false; spoken: string };

/** "Track a flight": live position + landing estimate, shown on the map too. */
function TrackFlight({ lat, lon, timeZone, onResult }: { lat: number; lon: number; timeZone: string; onResult: (f: FlightFix | null) => void }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/flight?${new URLSearchParams({ q: q.trim(), lat: lat.toFixed(4), lon: lon.toFixed(4), tz: timeZone })}`);
      const data = (await res.json()) as FlightResult;
      setAnswer(data.spoken);
      onResult(data.ok ? data.flight : null);
    } catch {
      setAnswer("The flight tracker isn't answering right now.");
      onResult(null);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <form className="flex gap-2" onSubmit={submit}>
        <label htmlFor="track-flight" className="sr-only">
          Track a flight
        </label>
        <input
          id="track-flight"
          className="min-w-0 flex-1 rounded border border-alfred-border/60 bg-transparent px-2 py-1.5 font-mono text-sm uppercase placeholder:normal-case"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Track a flight, e.g. UA 123"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <button type="submit" className="btn-ghost flex h-11 w-11 items-center justify-center" disabled={busy} aria-label="Track flight">
          <Search className="h-4 w-4" aria-hidden />
        </button>
      </form>
      {(busy || answer) && <p className="mt-1.5 text-xs text-alfred-mist" aria-live="polite">{busy ? "Looking it up…" : answer}</p>}
    </div>
  );
}

interface Props {
  pulse: PulseSnapshot | null;
  error: boolean;
  loading?: boolean;
  onRetry?: () => void;
  city: string;
  lat: number;
  lon: number;
  timeZone: string;
  /** Start open (Vitals module) or as a one-line strip (home). */
  defaultOpen?: boolean;
}

/**
 * Link to E's own God's Eye globe. Saved on this device only, since the globe
 * runs on one machine. IRIS just opens it in a new tab.
 */
function GodsEyeLink() {
  const [url, setUrl] = useState<string | null>(() => loadGodsEyeUrl());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [bad, setBad] = useState(false);

  const startEdit = () => {
    setDraft(url ?? GODS_EYE_DEFAULT);
    setBad(false);
    setEditing(true);
  };
  const save = () => {
    const next = normalizeGodsEyeUrl(draft);
    if (!next) {
      setBad(true);
      return;
    }
    saveGodsEyeUrl(next);
    setUrl(next);
    setEditing(false);
  };
  const unlink = () => {
    saveGodsEyeUrl(null);
    setUrl(null);
    setEditing(false);
  };

  if (editing) {
    return (
      <form
        className="space-y-1.5 rounded-md border border-alfred-border/60 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label htmlFor="gods-eye-url" className="hud-label flex items-center gap-1.5">
          <Globe2 className="h-3.5 w-3.5" aria-hidden /> God's Eye address
        </label>
        <input
          id="gods-eye-url"
          className="w-full rounded border border-alfred-border/60 bg-transparent px-2 py-1.5 font-mono text-sm"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setBad(false);
          }}
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={GODS_EYE_DEFAULT}
        />
        {bad && <p className="text-xs text-amber-300">That doesn't look like a web address. Try localhost:4173.</p>}
        <p className="text-[11px] text-alfred-mist">Where the globe runs once it's installed, usually {GODS_EYE_DEFAULT.replace("http://", "")}.</p>
        <div className="flex gap-2">
          <button type="submit" className="btn-ghost px-3 py-1 text-xs text-alfred-gold">
            Save
          </button>
          <button type="button" className="btn-ghost px-3 py-1 text-xs" onClick={() => setEditing(false)}>
            Cancel
          </button>
          {url && (
            <button type="button" className="btn-ghost ml-auto px-3 py-1 text-xs text-alfred-mist" onClick={unlink}>
              Unlink
            </button>
          )}
        </div>
      </form>
    );
  }

  if (!url) {
    return (
      <button type="button" className="flex min-h-[40px] items-center gap-1.5 text-[11px] text-alfred-mist hover:text-alfred-gold" onClick={startEdit}>
        <Globe2 className="h-3.5 w-3.5" aria-hidden /> Link God's Eye globe
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="flex flex-1 items-center justify-center gap-2 rounded-md border border-alfred-gold/50 bg-alfred-gold/10 px-3 py-2 font-mono text-xs uppercase tracking-wider text-alfred-gold hover:bg-alfred-gold/20"
      >
        <Globe2 className="h-4 w-4" aria-hidden /> Open God's Eye <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
      <button type="button" className="btn-ghost px-2 py-2 text-[11px] text-alfred-mist" onClick={startEdit} aria-label="Change God's Eye address">
        Edit
      </button>
    </div>
  );
}

/** Bay Area Pulse: alerts, air, fires, quakes, commute cams, flights overhead. */
export function PulsePanel({ pulse, error, loading = false, onRetry, city, lat, lon, timeZone, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [cam, setCam] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "map">(() => (defaultOpen ? "map" : loadView()));
  const [layers, setLayers] = useState<Record<MapLayer, boolean>>({ planes: true, quakes: true, fires: true, cams: true, ships: true });
  const [tracked, setTracked] = useState<FlightFix | null>(null);
  const pickView = (v: "list" | "map") => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* fine */
    }
  };
  const iss = pulse ? nextVisible(pulse.iss) : null;
  const moving = pulse?.ships?.filter((s) => (s.speedKt ?? 0) >= 0.5).length ?? 0;
  const urgent = Boolean(pulse && (pulse.alerts.length || (pulse.air && pulse.air.aqi > 100) || pulse.fires.some((f) => f.miles <= 30)));

  return (
    <section className={`panel-hud p-4 ${urgent ? "!border-amber-400/50" : ""}`} aria-label="Bay Area Pulse">
      <button type="button" className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="min-w-0">
          <span className="hud-label flex items-center gap-1.5">
            {urgent ? <AlertTriangle className="h-3.5 w-3.5 text-amber-300" aria-hidden /> : <Activity className="h-3.5 w-3.5" aria-hidden />} Bay Area Pulse
          </span>
          <span className={`mt-0.5 block truncate text-xs ${urgent ? "text-amber-200" : "text-alfred-mist"}`}>
            {pulse ? pulseSummary(pulse) : error ? "Pulse unavailable — tap Retry below" : loading ? "Checking the area…" : "Checking the area…"}
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-alfred-mist" /> : <ChevronDown className="h-4 w-4 shrink-0 text-alfred-mist" />}
      </button>

      {open && (
        <div className="mt-4">
          <GodsEyeLink />
        </div>
      )}

      {open && !pulse && (
        <div className="mt-4 rounded-md border border-alfred-border/50 bg-black/30 px-3 py-4 text-center text-sm text-alfred-mist">
          {loading ? (
            <p className="animate-pulse font-mono text-[11px] uppercase tracking-wider">Loading pulse…</p>
          ) : error ? (
            <div className="space-y-2">
              <p>Couldn&apos;t load Bay Area Pulse right now.</p>
              {onRetry ? (
                <button type="button" className="btn-gold text-xs" onClick={onRetry}>
                  Retry
                </button>
              ) : null}
            </div>
          ) : (
            <p className="animate-pulse font-mono text-[11px] uppercase tracking-wider">Loading pulse…</p>
          )}
        </div>
      )}

      {open && pulse && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2" role="group" aria-label="Pulse view">
            {(
              [
                ["list", "List", List],
                ["map", "Map", MapIcon],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => pickView(v)}
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-4 font-mono text-[11px] uppercase tracking-wider ${
                  view === v ? "border-alfred-gold bg-alfred-gold/15 text-alfred-gold" : "border-alfred-border/60 text-alfred-mist"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
              </button>
            ))}
          </div>

          {view === "map" && (
            <div className="space-y-2">
              <Suspense fallback={<div className="flex h-[340px] items-center justify-center rounded-md border border-alfred-border/60 text-xs text-alfred-mist">Loading map…</div>}>
                <PulseMap pulse={pulse} lat={lat} lon={lon} layers={layers} tracked={tracked} onCam={setCam} />
              </Suspense>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Map layers">
                {LAYER_LABELS.filter(([k]) => k !== "ships" || pulse.ships !== undefined).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={layers[k]}
                    onClick={() => setLayers((l) => ({ ...l, [k]: !l[k] }))}
                    className={`min-h-[36px] rounded-full border px-3.5 text-[12px] ${layers[k] ? "border-cyan-300/60 text-cyan-100" : "border-alfred-border/40 text-alfred-mist/70 line-through"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <TrackFlight lat={lat} lon={lon} timeZone={timeZone} onResult={setTracked} />

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
            <div className="hud-tile">
              <p className="flex items-center gap-1 font-mono text-[10px] uppercase text-alfred-mist">
                <Satellite className="h-3 w-3" aria-hidden /> ISS overhead
              </p>
              {pulse.iss === undefined ? (
                <p className="text-xs text-alfred-mist">No data</p>
              ) : iss ? (
                <p className="text-[12px] leading-snug">{describePass(iss, timeZone)}</p>
              ) : (
                <p className="text-xs text-alfred-mist">No visible passes in the next 2 days</p>
              )}
            </div>
            <div className="hud-tile">
              <p className="flex items-center gap-1 font-mono text-[10px] uppercase text-alfred-mist">
                <Ship className="h-3 w-3" aria-hidden /> Ships in the Bay
              </p>
              {pulse.ships === undefined ? (
                <p className="text-[11px] leading-snug text-alfred-mist">Add a free AISStream key to see ships</p>
              ) : pulse.ships === null ? (
                <p className="text-xs text-alfred-mist">No data</p>
              ) : (
                <>
                  <p className="font-mono text-lg">{pulse.ships.length}</p>
                  <p className="text-[11px] text-alfred-mist">{moving} moving</p>
                </>
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
                    <a href={q.url} target="_blank" rel="noreferrer" className="flex min-h-[40px] items-center justify-between gap-2 hover:text-alfred-gold">
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
                    <a href={`https://globe.adsb.lol/?icao=${encodeURIComponent(f.hex)}`} target="_blank" rel="noreferrer" className="flex min-h-[40px] items-center justify-between gap-2 hover:text-alfred-gold">
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
            Updated {ago(pulse.fetchedAt)} · USGS · NWS · Open-Meteo · NIFC · Caltrans · adsb.lol · CelesTrak{pulse.ships ? " · AISStream" : ""}
            {pulse.unavailable.length ? ` · unavailable: ${pulse.unavailable.join(", ")}` : ""}
          </p>
        </div>
      )}

      {cam && (
        <div className="fixed inset-0 z-[52] flex items-center justify-center bg-black/80 p-3" role="dialog" aria-modal aria-label="Traffic camera" onClick={() => setCam(null)}>
          <img src={cam} alt="Live traffic camera" className="max-h-[80vh] w-full max-w-xl rounded border border-alfred-border/60" />
          <button type="button" className="btn-ghost absolute right-4 top-4 p-2" onClick={() => setCam(null)} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}
