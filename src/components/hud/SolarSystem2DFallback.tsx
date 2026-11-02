import type { SolarPlanetId } from "../../../shared/solarPlanets";
import type { MergedPlanet } from "./SolarSystemStage.types";

function PlanetOrb2D({
  def,
  active,
  alert,
  badge,
  onSelect,
  slotDeg,
  counterDeg,
}: {
  def: MergedPlanet["def"];
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
      style={{ transform: `rotate(${slotDeg}deg) translateY(-46%)` }}
    >
      <button
        type="button"
        className="group relative flex flex-col items-center gap-1"
        style={{ transform: `rotate(${counterDeg}deg) translate(-50%, -50%)` }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={`Open ${def.label}`}
      >
        <span
          className={`block h-9 w-9 sm:h-11 sm:w-11 rounded-full border-2 ${
            active ? "scale-110 ring-2 ring-cyan-200/80" : alert ? "border-amber-400/70" : "border-white/20"
          }`}
          style={{
            background: `radial-gradient(circle at 32% 28%, ${def.color}, ${def.color}88 45%, #0a0a12 95%)`,
          }}
        />
        <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-200/75">
          {def.short}
          {badge != null && badge > 0 && (
            <span className="ml-1 text-amber-400">{badge > 9 ? "9+" : badge}</span>
          )}
        </span>
      </button>
    </div>
  );
}

export function SolarSystem2DFallback({
  merged,
  activeId,
  totalDeg,
  onSelect,
}: {
  merged: MergedPlanet[];
  activeId?: SolarPlanetId | null;
  totalDeg: number;
  onSelect: (id: SolarPlanetId) => void;
}) {
  const count = merged.length;
  const counterDeg = -totalDeg;
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ transform: `rotate(${totalDeg}deg)` }}>
      {merged.map(({ def, badge, alert }, i) => {
        const slotDeg = (360 / count) * i;
        return (
          <div key={def.id} className="pointer-events-auto">
            <PlanetOrb2D
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
  );
}
