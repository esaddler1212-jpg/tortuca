import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import type { SolarPlanetDef, SolarPlanetId } from "../../../shared/solarPlanets";
import { SOLAR_PLANETS } from "../../../shared/solarPlanets";
import { useSolarOrbit } from "../../hooks/useSolarOrbit";

export interface SolarPlanetView {
  id: SolarPlanetId;
  badge?: number;
  alert?: boolean;
}

interface Props {
  planets: SolarPlanetView[];
  activeId?: SolarPlanetId | null;
  /** Rotate this planet slot to the front (6 o'clock). */
  bringFrontId?: SolarPlanetId | null;
  /** Bumps when the same planet should spin forward again. */
  spinNonce?: number;
  onSelect: (id: SolarPlanetId) => void;
  sun: ReactNode;
  underSun?: ReactNode;
}

function PlanetOrb({
  def,
  active,
  alert,
  badge,
  onSelect,
  slotDeg,
  counterDeg,
}: {
  def: SolarPlanetDef;
  active: boolean;
  alert?: boolean;
  badge?: number;
  onSelect: () => void;
  slotDeg: number;
  counterDeg: number;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2 h-0 w-0"
      style={{ transform: `rotate(${slotDeg}deg) translateY(-46cqw)` }}
    >
      <button
        type="button"
        className="solar-planet group relative flex flex-col items-center gap-1"
        style={{ transform: `rotate(${counterDeg}deg) translate(-50%, -50%)` }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-current={active ? "true" : undefined}
        aria-label={`Open ${def.label}`}
      >
        <span
          className={`solar-planet-body block h-9 w-9 sm:h-11 sm:w-11 rounded-full border-2 shadow-hud transition-transform group-hover:scale-110 ${
            active ? "scale-110 ring-2 ring-cyan-200/80" : alert ? "border-amber-400/70" : "border-white/20"
          }`}
          style={{
            background: `radial-gradient(circle at 32% 28%, ${def.color}, ${def.color}88 45%, #0a0a12 95%)`,
            boxShadow: active ? `0 0 20px ${def.color}66` : undefined,
          }}
        />
        <span
          className={`font-mono text-[9px] sm:text-[10px] uppercase tracking-wider whitespace-nowrap ${
            active ? "text-cyan-100" : "text-cyan-200/75"
          }`}
        >
          {def.short}
          {badge != null && badge > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}

/** Solar system: Iris is the sun; modules orbit slowly. Drag or scroll to spin. */
export function SolarSystemStage({ planets, activeId, bringFrontId, spinNonce = 0, onSelect, sun, underSun }: Props) {
  const { totalDeg, setFrontForSlot, orbitHandlers } = useSolarOrbit(0);
  const count = planets.length;

  const merged = useMemo(() => {
    const map = new Map(planets.map((p) => [p.id, p]));
    return SOLAR_PLANETS.filter((d) => map.has(d.id)).map((d) => ({
      def: d,
      ...map.get(d.id)!,
    }));
  }, [planets]);

  useEffect(() => {
    if (!bringFrontId) return;
    const idx = merged.findIndex((m) => m.def.id === bringFrontId);
    if (idx < 0) return;
    const slotDeg = (360 / count) * idx;
    setFrontForSlot(slotDeg);
  }, [bringFrontId, spinNonce, count, merged, setFrontForSlot]);

  const counterDeg = -totalDeg;

  return (
    <section className="solar-system mx-auto w-full max-w-[min(98vw,820px)]" aria-label="E solar system">
      <div
        className="relative mx-auto aspect-square w-full max-w-[640px] touch-pan-y cursor-grab active:cursor-grabbing select-none"
        style={{ containerType: "inline-size" }}
        {...orbitHandlers}
        role="application"
        aria-roledescription="orbit"
        aria-label="Drag or scroll to spin the orbit. Tap a planet to open its module."
      >
        <div
          className="pointer-events-none absolute inset-[8%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgb(var(--accent-500) / 0.14) 0%, rgb(var(--accent-600) / 0.06) 38%, transparent 68%)",
          }}
          aria-hidden
        />

        <div className="absolute inset-[22%] z-20 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-[min(78cqw,400px)]">{sun}</div>
          {underSun && (
            <div className="pointer-events-auto w-full max-w-[min(88cqw,480px)] px-1">{underSun}</div>
          )}
        </div>

        <div
          className="absolute inset-[6%] rounded-full border border-cyan-500/15 pointer-events-none"
          style={{ transform: `rotate(${totalDeg}deg)` }}
          aria-hidden
        />

        <div className="absolute inset-0 pointer-events-none" style={{ transform: `rotate(${totalDeg}deg)` }}>
          {merged.map(({ def, badge, alert }, i) => {
            const slotDeg = (360 / count) * i;
            return (
              <div key={def.id} className="pointer-events-auto">
                <PlanetOrb
                  def={def}
                  active={activeId === def.id}
                  alert={alert}
                  badge={badge}
                  slotDeg={slotDeg}
                  counterDeg={counterDeg}
                  onSelect={() => onSelect(def.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-400/45 px-2">
        Drag or scroll the orbit · tap a planet · ask Iris to bring one forward
      </p>
    </section>
  );
}
