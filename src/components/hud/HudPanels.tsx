import { CheckCircle2, CircleOff, Link2, Unlink } from "lucide-react";
import type { CalendarEvent, EmailMessage, WeatherSnapshot } from "../../types";
import type { WoodhouseOrchestrationSnapshot } from "../../types/woodhouse";
import type { FitnessStatus } from "../../lib/fitness";
import { weatherLabel } from "../../lib/weather";
import { HudFrame } from "./HudFrame";

const fmtTime = (iso: string, timeZone: string) => {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(
      new Date(iso),
    );
  } catch {
    return "--:--";
  }
};


/* ─── Left column ───────────────────────────────────────────────── */

export function VitalsPanel({
  weather,
  weatherLoading = false,
  weatherError = null,
  city,
  fitness,
}: {
  weather: WeatherSnapshot | null;
  weatherLoading?: boolean;
  weatherError?: string | null;
  city: string;
  fitness: FitnessStatus;
}) {
  const weekTotal = Object.values(fitness.weekCounts).reduce((a, b) => a + b, 0);
  const weatherLine = weatherLoading
    ? "…"
    : weatherError
      ? "--"
      : weather
        ? `${Math.round(weather.temperature)}°`
        : "--";
  const weatherSub = weatherLoading
    ? "Loading weather"
    : weatherError
      ? "Try again soon"
      : weather
        ? weatherLabel(weather.weatherCode)
        : "No data";
  return (
    <HudFrame title="Vitals" tag={city}>
      <p className="font-mono text-[11px] uppercase tracking-widest text-cyan-400/50">Outside</p>
      <p className="font-display text-3xl text-cyan-300 hud-glow-text">
        {weatherLine}
        <span className="ml-2 font-mono text-xs text-cyan-100/70">{weatherSub}</span>
      </p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="hud-tile">
          <p className="font-mono text-[10px] uppercase text-cyan-400/50">High / Low</p>
          <p className="font-mono text-sm text-cyan-100">
            {weather ? `${Math.round(weather.high)}° / ${Math.round(weather.low)}°` : "--"}
          </p>
        </div>
        <div className="hud-tile">
          <p className="font-mono text-[10px] uppercase text-cyan-400/50">Training</p>
          <p className="font-mono text-sm text-cyan-100">
            {fitness.loggedToday ? "Logged" : "Open"} · {weekTotal}/wk
          </p>
        </div>
      </div>
    </HudFrame>
  );
}


export function NetworkPanel({
  woodhouse,
  loading = false,
  error = null,
  googleConnected,
  onConnectGoogle,
  onOpenTeam,
}: {
  woodhouse: WoodhouseOrchestrationSnapshot | null;
  loading?: boolean;
  error?: string | null;
  googleConnected: boolean;
  onConnectGoogle?: () => void;
  onOpenTeam?: () => void;
}) {
  const nodes = woodhouse?.nodes ?? [];
  const online = nodes.filter((n) => n.ok).length;
  return (
    <HudFrame title="Woodhouse" tag={loading ? "Syncing…" : `${online}/${nodes.length} online`}>
      {loading && !nodes.length ? (
        <p className="py-6 text-center font-mono text-[11px] uppercase tracking-wider text-cyan-400/50 animate-pulse">
          Syncing apps…
        </p>
      ) : null}
      {error && !nodes.length ? (
        <p className="text-sm text-amber-200/90 mb-2">{error}</p>
      ) : null}
      <ul className="space-y-1.5 font-mono text-xs">
        {nodes.map((n) => (
          <li key={n.registryId} className="flex items-center justify-between gap-2">
            {n.ok && n.baseUrl ? (
              <a
                href={n.baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-cyan-100/85 hover:text-cyan-200 underline-offset-2 hover:underline"
              >
                {n.displayName}
              </a>
            ) : (
              <span className="truncate text-cyan-100/85" title={n.error ?? undefined}>
                {n.displayName}
              </span>
            )}
            {n.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-label="online" />
            ) : (
              <CircleOff className="h-3.5 w-3.5 shrink-0 text-red-300" aria-label="offline" />
            )}
          </li>
        ))}
        {!nodes.length && (
          <li className="text-cyan-400/50">
            No Woodhouse nodes — set WOODHOUSE_NODES on Netlify or add URLs in Settings.
          </li>
        )}
        <li className="flex items-center justify-between gap-2 border-t border-cyan-400/10 pt-1.5">
          <span className="text-cyan-100/85">Google</span>
          {googleConnected ? (
            <span className="flex items-center gap-1 text-cyan-300">
              <Link2 className="h-3.5 w-3.5" /> Linked
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-300">
              <Unlink className="h-3.5 w-3.5" /> Not linked
            </span>
          )}
        </li>
      </ul>
      {!googleConnected && onConnectGoogle ? (
        <button type="button" className="btn-gold mt-3 w-full text-xs sm:w-auto" onClick={onConnectGoogle}>
          Connect Google
        </button>
      ) : null}
      {onOpenTeam ? (
        <button type="button" className="mt-4 w-full rounded-md border border-sky-400/30 px-3 py-2 text-left text-xs text-sky-100/90 hover:border-sky-300/50" onClick={onOpenTeam}>
          <span className="font-mono uppercase tracking-wider text-sky-400/80">Iris team</span>
          <span className="block text-alfred-mist mt-0.5">Org chart, specialists, last delegate →</span>
        </button>
      ) : null}
      <p className="mt-4 text-[10px] leading-relaxed text-cyan-400/45 font-mono">
        Optional on your machine (not required):{" "}
        <a href="https://voicebox.sh" target="_blank" rel="noopener noreferrer" className="text-cyan-400/70 hover:underline">
          Voicebox
        </a>{" "}
        for local cloned TTS · server{" "}
        <a href="https://github.com/esaddler1212-jpg/tortuca/blob/main/docs/SERVER_PLAN.md" target="_blank" rel="noopener noreferrer" className="text-cyan-400/70 hover:underline">
          n8n
        </a>{" "}
        for scheduled Shopify/Gmail workflows.
      </p>
    </HudFrame>
  );
}

/* ─── Right column ──────────────────────────────────────────────── */

export function RoadmapPanel({ woodhouse }: { woodhouse: WoodhouseOrchestrationSnapshot | null }) {
  const node = woodhouse?.nodes.find((n) => n.registryId === "ecs-roadmap")?.snapshot;
  return (
    <HudFrame title="ECS roadmap" tag="Vantage">
      {node ? (
        <>
          <p className="font-mono text-xs text-cyan-100/85 mb-3">{node.summary}</p>
          <div className="grid grid-cols-2 gap-2">
            {node.metrics.map((m) => (
              <div key={m.key} className={`hud-tile ${m.alert ? "border-amber-400/40" : ""}`}>
                <p className="font-mono text-[10px] uppercase text-cyan-400/50 truncate" title={m.label}>
                  {m.label}
                </p>
                <p className={`font-mono text-sm ${m.alert ? "text-amber-300" : "text-cyan-300"}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="font-mono text-xs text-cyan-400/50">Roadmap node not reporting.</p>
      )}
    </HudFrame>
  );
}

interface LogLine {
  at: string;
  text: string;
  tone?: "alert";
}

export function LogPanel({
  timeline,
  woodhouse,
  messages,
  timeZone,
}: {
  timeline: CalendarEvent[];
  woodhouse: WoodhouseOrchestrationSnapshot | null;
  messages: EmailMessage[];
  timeZone: string;
}) {
  const lines: LogLine[] = [
    ...timeline.map((e) => ({ at: e.start, text: e.title.toUpperCase() })),
    ...(woodhouse?.priorityActions ?? []).slice(0, 4).map((a) => ({
      at: woodhouse!.generatedAt,
      text: a.toUpperCase(),
      tone: "alert" as const,
    })),
    ...messages
      .filter((m) => m.unread)
      .slice(0, 3)
      .map((m) => ({ at: m.date, text: `MAIL · ${m.from.replace(/<.*>/, "").trim()}`.toUpperCase() })),
  ]
    .filter((l) => !Number.isNaN(new Date(l.at).getTime()))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .slice(-9);

  return (
    <HudFrame title="Log" tag="RT-log">
      <ul className="space-y-1.5 font-mono text-[11px] leading-snug">
        {lines.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-cyan-400/40 shrink-0">[{fmtTime(l.at, timeZone)}]</span>
            <span className={l.tone === "alert" ? "text-amber-200/90" : "text-cyan-100/85"}>{l.text}</span>
          </li>
        ))}
        {!lines.length && <li className="text-cyan-400/50">Nothing on the log right now.</li>}
      </ul>
    </HudFrame>
  );
}

