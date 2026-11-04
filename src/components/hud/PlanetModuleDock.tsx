import { useEffect, useRef, type ReactNode } from "react";
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
  const ref = useRef<HTMLElement>(null);

  // Bring the module into view when it opens (on a phone it starts below the
  // ring, command bar and dock). Gentle scroll unless the person prefers less motion.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" }));
  }, [planetId]);

  const close = () => {
    onClose();
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
  };

  return (
    <section
      ref={ref}
      className="planet-dock hud-frame mt-4 animate-fade-in scroll-mt-[calc(env(safe-area-inset-top)+76px)]"
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
        <button type="button" className="btn-gold min-h-[44px] px-4 text-xs" onClick={close}>
          <span className="sm:hidden">‹ Back</span>
          <span className="hidden sm:inline">Back to solar system</span>
        </button>
      </header>
      <div className="planet-dock-body space-y-4 lg:max-h-[min(70vh,900px)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
        {children}
      </div>
    </section>
  );
}
