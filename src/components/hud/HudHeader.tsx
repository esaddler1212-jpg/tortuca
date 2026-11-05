import { useEffect, useState } from "react";
import { Bell, ChevronDown, Settings } from "lucide-react";
import { FOCUS_CHOICE_LABEL, type FocusChoice } from "../../../shared/dayMode";
import { HudRing } from "../HudRing";
import { openSettings } from "../../lib/settingsEvents";

export type SystemStatus = "ok" | "degraded" | "offline";

const STATUS_TEXT: Record<SystemStatus, { label: string; dot: string; text: string }> = {
  ok: { label: "Optimal", dot: "bg-cyan-400", text: "text-cyan-300" },
  degraded: { label: "Degraded", dot: "bg-amber-400", text: "text-amber-300" },
  offline: { label: "Network", dot: "bg-red-400", text: "text-red-300" },
};

function useClock(timeZone: string) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
  } catch {
    return now.toLocaleTimeString();
  }
}

interface Props {
  timeZone: string;
  status: SystemStatus;
  alerts: number;
  operator: string;
  focusChoice: FocusChoice;
  onFocusChoice: (c: FocusChoice) => void;
}

export function HudHeader({ timeZone, status, alerts, operator, focusChoice, onFocusChoice }: Props) {
  const time = useClock(timeZone);
  const s = STATUS_TEXT[status];
  return (
    <header className="safe-top sticky top-0 z-10 border-b border-cyan-400/15 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <HudRing className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-[0.3em] text-cyan-300 hud-glow-text">IRIS</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400/50 truncate">
              Chief of staff · ECS Network
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-1 justify-center gap-10 font-mono">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/50">System status</p>
            <p className={`text-sm uppercase tracking-widest flex items-center justify-center gap-2 ${s.text}`}>
              <span className={`h-2 w-2 rounded-full ${s.dot} animate-hud-pulse`} />
              {s.label}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/50">Local time</p>
            <p className="text-sm tracking-widest text-cyan-100 tabular-nums">{time}</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="md:hidden font-mono text-xs text-cyan-100 tabular-nums">{time.slice(0, 5)}</span>
          {/* Focus menu: Auto, Family Purpose, ECS Network, or the Vantage Point briefing on demand */}
          <label className="relative flex min-h-[44px] items-center">
            <span className="sr-only">Focus</span>
            {/* What you see: compact label. What you tap: the real picker on top, invisible,
                at 16px so iPhone opens its picker without zooming the page. */}
            <span
              className="pointer-events-none flex items-center rounded-full border border-cyan-400/30 bg-cyan-950/40 py-1.5 pl-3 pr-7 font-mono text-[11px] uppercase tracking-wider text-cyan-200 whitespace-nowrap"
              aria-hidden
            >
              <span className="sm:hidden">{focusChoice === "auto" ? "Auto" : FOCUS_CHOICE_LABEL[focusChoice]}</span>
              <span className="hidden sm:inline">{focusChoice === "auto" ? "Focus: Auto" : FOCUS_CHOICE_LABEL[focusChoice]}</span>
            </span>
            <select
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
              style={{ fontSize: 16 }}
              value={focusChoice}
              onChange={(e) => onFocusChoice(e.target.value as FocusChoice)}
              aria-label="Focus"
            >
              {(Object.keys(FOCUS_CHOICE_LABEL) as FocusChoice[]).map((c) => (
                <option key={c} value={c}>
                  {c === "auto" ? "Focus: Auto" : FOCUS_CHOICE_LABEL[c]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-cyan-300/70" aria-hidden />
          </label>
          <span className="relative flex h-11 w-11 items-center justify-center text-cyan-300/80" aria-label={`${alerts} alerts`} title={`${alerts} urgent`}>
            <Bell className="h-5 w-5" />
            {alerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-cyan-400 text-[10px] font-mono text-black leading-4 text-center">
                {alerts}
              </span>
            )}
          </span>
          <button type="button" className="flex h-11 w-11 items-center justify-center text-cyan-300/80 hover:text-cyan-200" onClick={openSettings} aria-label="Settings">
            <Settings className="h-5 w-5" />
          </button>
          <span className="hidden sm:flex items-center gap-2 rounded-full border border-cyan-400/25 pl-3 pr-1 py-1 font-mono text-xs uppercase tracking-widest text-cyan-200">
            {operator}
            <span className="h-7 w-7 rounded-full border border-cyan-400/40 bg-cyan-950/60 shadow-hud" />
          </span>
        </div>
      </div>
    </header>
  );
}
