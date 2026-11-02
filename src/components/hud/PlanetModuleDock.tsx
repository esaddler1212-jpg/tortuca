import type { ReactNode } from "react";
import { SOLAR_PLANETS, type SolarPlanetId } from "../../../shared/solarPlanets";

export function PlanetModuleDock({
  planetId,
  onClose,
  children,
}: {
  planetId: SolarPlanetId;
  onClose: () => void;
  children: ReactNode;
}) {
  const def = SOLAR_PLANETS.find((p) => p.id === planetId);
  const label = def?.label ?? planetId;

  return (
    <section
      className="planet-dock hud-frame mt-4 animate-fade-in"
      aria-label={`${label} module`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-400/10 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ background: def?.color ?? "#67e8f9", boxShadow: `0 0 12px ${def?.color ?? "#67e8f9"}88` }}
            aria-hidden
          />
          <h2 className="font-mono text-sm uppercase tracking-[0.25em] text-cyan-100">{label}</h2>
        </div>
        <button type="button" className="btn-gold text-xs px-3 py-1.5" onClick={onClose}>
          Back to solar system
        </button>
      </header>
      <div className="planet-dock-body space-y-4 max-h-[min(70vh,900px)] overflow-y-auto overscroll-contain pr-1">
        {children}
      </div>
    </section>
  );
}
