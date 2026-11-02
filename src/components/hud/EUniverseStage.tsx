import type { ReactNode } from "react";

export interface UniversePlanet {
  id: string;
  label: string;
  short?: string;
  /** 0–360, degrees from top (12 o'clock) */
  angle: number;
  badge?: number;
  alert?: boolean;
}

interface Props {
  planets: UniversePlanet[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  core: ReactNode;
  belowCore?: ReactNode;
}

/** E-universe: Iris at the center; apps and consoles orbit as selectable planets. */
export function EUniverseStage({ planets, activeId, onSelect, core, belowCore }: Props) {
  return (
    <section className="e-universe relative mx-auto w-full max-w-[min(96vw,780px)]" aria-label="E universe — Iris and orbiting apps">
      <div
        className="relative mx-auto aspect-square w-full max-w-[620px]"
        style={{ containerType: "inline-size" }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgb(var(--accent-500)/0.08),transparent_62%)]" aria-hidden />
        <svg className="pointer-events-none absolute inset-[4%] h-[92%] w-[92%] animate-hud-spin opacity-40" viewBox="0 0 400 400" fill="none" aria-hidden style={{ animationDuration: "180s" }}>
          <circle cx="200" cy="200" r="178" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="6 10" className="text-cyan-400" />
          <circle cx="200" cy="200" r="152" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" className="text-cyan-400" />
        </svg>

        <div className="absolute inset-[18%] flex flex-col items-center justify-center gap-3 z-10">
          <div className="w-full max-w-[min(88cqw,420px)]">{core}</div>
          {belowCore && <div className="w-full max-w-[min(92cqw,480px)]">{belowCore}</div>}
        </div>

        {planets.map((planet) => {
          const rad = ((planet.angle - 90) * Math.PI) / 180;
          const r = 46.5;
          const x = 50 + r * Math.cos(rad);
          const y = 50 + r * Math.sin(rad);
          const active = activeId === planet.id;
          return (
            <button
              key={planet.id}
              type="button"
              className={`e-universe-planet absolute z-20 flex flex-col items-center gap-0.5 rounded-full border px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider transition-all sm:text-[10px] sm:px-2.5 sm:py-2 ${
                active
                  ? "border-cyan-300/80 bg-cyan-950/90 text-cyan-100 shadow-hud scale-110"
                  : planet.alert
                    ? "border-amber-400/50 bg-black/80 text-amber-100/90 hover:border-amber-300/70"
                    : "border-cyan-500/25 bg-black/75 text-cyan-200/80 hover:border-cyan-400/50 hover:text-cyan-100"
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => onSelect(planet.id)}
              aria-current={active ? "true" : undefined}
            >
              <span className="relative whitespace-nowrap">
                {planet.short ?? planet.label}
                {planet.badge != null && planet.badge > 0 && (
                  <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black">
                    {planet.badge > 9 ? "9+" : planet.badge}
                  </span>
                )}
              </span>
              <span className="hidden sm:inline text-[8px] tracking-[0.2em] text-cyan-400/50">{planet.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400/45">
        Tap a planet · Iris stays at the center
      </p>
    </section>
  );
}
