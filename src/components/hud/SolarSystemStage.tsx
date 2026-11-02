import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";
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
  /** When set, only this planet orb is shown on desktop orbit (focused visit). */
  focusedId?: SolarPlanetId | null;
  /** Rotate this planet slot to the front (6 o'clock) on desktop. */
  bringFrontId?: SolarPlanetId | null;
  /** Bumps when the same planet should spin forward again. */
  spinNonce?: number;
  onSelect: (id: SolarPlanetId) => void;
  sun: ReactNode;
  underSun?: ReactNode;
}

function PlanetButton({
  def,
  active,
  alert,
  badge,
  onSelect,
  layout,
}: {
  def: SolarPlanetDef;
  active: boolean;
  alert?: boolean;
  badge?: number;
  onSelect: () => void;
  layout: "orbit" | "dock";
}) {
  const bodySize =
    layout === "dock"
      ? "h-11 w-11 sm:h-12 sm:w-12 ring-1 ring-cyan-400/25"
      : "h-9 w-9 sm:h-11 sm:w-11";

  return (
    <button
      type="button"
      className={`solar-planet group relative flex flex-col items-center gap-1 ${
        layout === "dock" ? "min-w-[4.25rem] shrink-0 snap-center px-0.5" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-current={active ? "true" : undefined}
      aria-label={`Open ${def.label}`}
    >
      <span
        className={`solar-planet-body block rounded-full border-2 shadow-hud transition-transform group-hover:scale-105 group-active:scale-95 ${bodySize} ${
          active ? "scale-105 ring-2 ring-cyan-200/80" : alert ? "border-amber-400/70" : "border-white/20"
        }`}
        style={{
          background: `radial-gradient(circle at 32% 28%, ${def.color}, ${def.color}88 45%, #0a0a12 95%)`,
          boxShadow: active ? `0 0 20px ${def.color}66` : undefined,
        }}
      />
      <span
        className={`font-mono uppercase tracking-wider whitespace-nowrap ${
          layout === "dock" ? "text-[8px] sm:text-[9px] max-w-[4.5rem] truncate" : "text-[9px] sm:text-[10px]"
        } ${active ? "text-cyan-100" : "text-cyan-200/75"}`}
      >
        {def.short}
        {badge != null && badge > 0 && (
          <span className="ml-0.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[8px] font-bold text-black">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
    </button>
  );
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
      style={{ transform: `rotate(${slotDeg}deg) translateY(-48cqw)` }}
    >
      <div style={{ transform: `rotate(${counterDeg}deg) translate(-50%, -50%)` }}>
        <PlanetButton def={def} active={active} alert={alert} badge={badge} onSelect={onSelect} layout="orbit" />
      </div>
    </div>
  );
}

function SolarHudMobile({
  merged,
  activeId,
  onSelect,
  sun,
  underSun,
  bringFrontId,
  spinNonce,
}: {
  merged: { def: SolarPlanetDef; badge?: number; alert?: boolean }[];
  activeId?: SolarPlanetId | null;
  onSelect: (id: SolarPlanetId) => void;
  sun: ReactNode;
  underSun?: ReactNode;
  bringFrontId?: SolarPlanetId | null;
  spinNonce: number;
}) {
  const dockRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<SolarPlanetId, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!bringFrontId) return;
    const el = itemRefs.current.get(bringFrontId);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [bringFrontId, spinNonce]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative flex w-full max-w-md flex-col items-center">
        <div className="solar-hub-rings pointer-events-none absolute left-1/2 top-[min(8vw,28px)] aspect-square w-[min(88vw,320px)] -translate-x-1/2" aria-hidden />
        <div className="relative z-10 w-full max-w-[min(68vw,260px)]">{sun}</div>
        {underSun && <div className="relative z-10 mt-3 w-full px-0.5">{underSun}</div>}
      </div>

      <nav className="solar-dock w-full max-w-lg" aria-label="Module dock">
        <p className="mb-2 text-center font-mono text-[9px] uppercase tracking-[0.35em] text-cyan-400/40">Modules</p>
        <div
          ref={dockRef}
          className="flex gap-1 overflow-x-auto overscroll-x-contain px-2 pb-1 pt-1 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {merged.map(({ def, badge, alert }) => (
            <div
              key={def.id}
              ref={(node) => {
                if (node) itemRefs.current.set(def.id, node);
                else itemRefs.current.delete(def.id);
              }}
              className="shrink-0 snap-center"
            >
              <PlanetButton
                def={def}
                active={activeId === def.id}
                alert={alert}
                badge={badge}
                onSelect={() => onSelect(def.id)}
                layout="dock"
              />
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}

function SolarOrbitDesktop({
  merged,
  count,
  activeId,
  onSelect,
  sun,
  underSun,
  totalDeg,
  counterDeg,
  orbitHandlers,
}: {
  merged: { def: SolarPlanetDef; badge?: number; alert?: boolean }[];
  count: number;
  activeId?: SolarPlanetId | null;
  onSelect: (id: SolarPlanetId) => void;
  sun: ReactNode;
  underSun?: ReactNode;
  totalDeg: number;
  counterDeg: number;
  orbitHandlers: ReturnType<typeof useSolarOrbit>["orbitHandlers"];
}) {
  return (
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

      <div className="absolute inset-[28%] z-20 flex flex-col items-center justify-center gap-2 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-[min(72cqw,380px)]">{sun}</div>
        {underSun && (
          <div className="pointer-events-auto w-full max-w-[min(84cqw,460px)] px-1">{underSun}</div>
        )}
      </div>

      <div
        className="absolute inset-[5%] rounded-full border border-cyan-500/15 pointer-events-none"
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
  );
}

/** Iris at the center; modules as a phone dock or desktop orbit. */
export function SolarSystemStage({
  planets,
  activeId,
  focusedId,
  bringFrontId,
  spinNonce = 0,
  onSelect,
  sun,
  underSun,
}: Props) {
  const { totalDeg, setFrontForSlot, orbitHandlers } = useSolarOrbit(0);
  const count = planets.length;

  const mergedAll = useMemo(() => {
    const map = new Map(planets.map((p) => [p.id, p]));
    return SOLAR_PLANETS.filter((d) => map.has(d.id)).map((d) => ({
      def: d,
      ...map.get(d.id)!,
    }));
  }, [planets]);

  const mergedOrbit = useMemo(() => {
    if (!focusedId) return mergedAll;
    return mergedAll.filter((m) => m.def.id === focusedId);
  }, [mergedAll, focusedId]);

  useEffect(() => {
    if (!bringFrontId) return;
    const idx = mergedAll.findIndex((m) => m.def.id === bringFrontId);
    if (idx < 0) return;
    const slotDeg = (360 / count) * idx;
    setFrontForSlot(slotDeg);
  }, [bringFrontId, spinNonce, count, mergedAll, setFrontForSlot]);

  const counterDeg = -totalDeg;

  return (
    <section className="solar-system mx-auto w-full max-w-[min(98vw,820px)]" aria-label="E solar system">
      <div className="lg:hidden">
        <SolarHudMobile
          merged={mergedAll}
          activeId={activeId}
          onSelect={onSelect}
          sun={sun}
          underSun={underSun}
          bringFrontId={bringFrontId}
          spinNonce={spinNonce}
        />
      </div>

      <div className="hidden lg:block">
        <SolarOrbitDesktop
          merged={mergedOrbit}
          count={count}
          activeId={activeId}
          onSelect={onSelect}
          sun={sun}
          underSun={underSun}
          totalDeg={totalDeg}
          counterDeg={counterDeg}
          orbitHandlers={orbitHandlers}
        />
      </div>

      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-400/45 px-2">
        <span className="lg:hidden">
          {focusedId
            ? "One module at a time · pick another in the dock or go back"
            : "Tap Iris to talk · swipe the dock · tap a module"}
        </span>
        <span className="hidden lg:inline">
          {focusedId
            ? "One world at a time · back to solar system to choose another"
            : "Drag or scroll the orbit · tap a planet · ask Iris to bring one forward"}
        </span>
      </p>
    </section>
  );
}
