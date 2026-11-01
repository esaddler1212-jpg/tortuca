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
  city,
  fitness,
}: {
  weather: WeatherSnapshot | null;
  city: string;
  fitness: FitnessStatus;
}) {
  const weekTotal = Object.values(fitness.weekCounts).reduce((a, b) => a + b, 0);
  return (
    <HudFrame title="Vitals" tag={city}>
      <p className="font-mono text-[11px] uppercase tracking-widest text-cyan-400/50">Outside</p>
      <p className="font-display text-3xl text-cyan-300 hud-glow-text">
        {weather ? `${Math.round(weather.temperature)}°` : "--"}
        <span className="ml-2 font-mono text-xs text-cyan-100/70">{weather ? weatherLabel(weather.weatherCode) : "No data"}</span>
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
  googleConnected,
}: {
  woodhouse: WoodhouseOrchestrationSnapshot | null;
  googleConnected: boolean;
}) {
  const nodes = woodhouse?.nodes ?? [];
  const online = nodes.filter((n) => n.ok).length;
  return (
    <HudFrame title="Network" tag={`Woodhouse ${online}/${nodes.length}`}>
      <ul className="space-y-1.5 font-mono text-xs">
        {nodes.map((n) => (
          <li key={n.registryId} className="flex items-center justify-between gap-2">
            <span className="truncate text-cyan-100/85">{n.displayName}</span>
            {n.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-label="online" />
            ) : (
              <CircleOff className="h-3.5 w-3.5 shrink-0 text-red-300" aria-label="offline" />
            )}
          </li>
        ))}
        {!nodes.length && <li className="text-cyan-400/50">No apps registered</li>}
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
        {!lines.length && <li className="text-cyan-400/50">[--:--] ALL QUIET</li>}
      </ul>
    </HudFrame>
  );
}

