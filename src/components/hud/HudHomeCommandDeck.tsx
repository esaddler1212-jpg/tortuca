import { clockTime } from "../../../shared/timezone";
import type { ReactNode } from "react";
import type { LeaveByPlan } from "../../lib/leaveBy";
import type { UserSettings } from "../../types";
import type { WoodhouseOrchestrationSnapshot } from "../../types/woodhouse";

interface Props {
  settings: UserSettings;
  leaveBy: LeaveByPlan | null;
  unread: number;
  urgent: number;
  dayPct: number;
  woodhouse: WoodhouseOrchestrationSnapshot | null;
  core: ReactNode;
  upNext: ReactNode;
}

/** Option 3 — three-column command deck on iPad landscape (≥833px). */
export function HudHomeCommandDeck({
  settings,
  leaveBy,
  unread,
  urgent,
  dayPct,
  woodhouse,
  core,
  upNext,
}: Props) {
  const nodes = woodhouse?.nodes ?? [];
  const jarvis = nodes.find((n) => /jarvis/i.test(n.registryId) || /jarvis/i.test(n.displayName));
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: settings.timezone,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).format(new Date());

  return (
    <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:items-start">
      <section className="hud-glass relative lg:col-span-3 p-4 space-y-3" aria-label="Status">
        <span className="hud-glass-corner left-0 top-0 border-l-2 border-t-2" aria-hidden />
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400/60">Status</p>
        <p className="font-mono text-sm text-cyan-50">{time}</p>
        {leaveBy ? (
          <p className="text-xs text-cyan-100/85">
            ▲ Leave {clockTime(leaveBy.leaveBy, settings.timezone)} · {leaveBy.destination}
          </p>
        ) : null}
        {unread > 0 ? (
          <p className="text-xs text-amber-200/90">
            Inbox · {unread} unread
          </p>
        ) : null}
        {urgent > 0 ? (
          <p className="text-xs text-amber-200/90">Today · {urgent} urgent</p>
        ) : null}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400/50 mb-2">Crew</p>
          <ul className="space-y-1 text-xs text-cyan-100/90 font-mono">
            <li>Iris · live</li>
            <li>Alfred · sidecar</li>
            <li>
              JARVIS-OS · {jarvis?.ok ? "online" : "off"}
            </li>
          </ul>
        </div>
      </section>

      <section className="relative lg:col-span-6 flex flex-col items-center gap-3" aria-label="Core">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/70 lg:hidden">Core</p>
        <div className="relative w-full max-w-[420px]">{core}</div>
        <div className="w-full max-w-xs space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400/60 text-center">
            Day · {Math.round(dayPct * 100)}%
          </p>
          <div className="h-1 rounded-full bg-cyan-950/80 overflow-hidden">
            <div
              className="h-full bg-cyan-400/80 transition-all duration-700"
              style={{ width: `${Math.round(dayPct * 100)}%` }}
            />
          </div>
        </div>
      </section>

      <div className="lg:col-span-3 space-y-4">{upNext}</div>
    </div>
  );
}
