import type { ReactNode } from "react";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import type { SolarPlanetId } from "../../../shared/solarPlanets";
import { SOLAR_PLANETS } from "../../../shared/solarPlanets";
import { useSolarOrbit } from "../../hooks/useSolarOrbit";
import type { SolarPlanetView } from "./SolarSystemStage.types";
import { SolarSystem2DFallback } from "./SolarSystem2DFallback";
import { WebGLBoundary } from "./WebGLBoundary";

const SolarSystemCanvas = lazy(() =>
  import("./SolarSystemCanvas").then((m) => ({ default: m.SolarSystemCanvas })),
);

export type { SolarPlanetView };

interface Props {
  planets: SolarPlanetView[];
  activeId?: SolarPlanetId | null;
  focusedId?: SolarPlanetId | null;
  bringFrontId?: SolarPlanetId | null;
  spinNonce?: number;
  onSelect: (id: SolarPlanetId) => void;
  sun: ReactNode;
  underSun?: ReactNode;
}

/** Solar system: 3D WebGL orbit with Iris (HTML sun) centered on top. */
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
  const [use3d, setUse3d] = useState(true);

  const merged = useMemo(() => {
    const map = new Map(planets.map((p) => [p.id, p]));
    let list = SOLAR_PLANETS.filter((d) => map.has(d.id)).map((d) => ({
      def: d,
      ...map.get(d.id)!,
    }));
    if (focusedId) {
      list = list.filter((m) => m.def.id === focusedId);
    }
    return list;
  }, [planets, focusedId]);

  const scenePlanets = useMemo(
    () =>
      merged.map((m) => ({
        def: m.def,
        badge: m.badge,
        alert: m.alert,
        active: activeId === m.def.id,
      })),
    [merged, activeId],
  );

  useEffect(() => {
    if (!bringFrontId) return;
    const idx = merged.findIndex((m) => m.def.id === bringFrontId);
    if (idx < 0) return;
    const slotDeg = (360 / Math.max(merged.length, 1)) * idx;
    setFrontForSlot(slotDeg);
  }, [bringFrontId, spinNonce, merged, setFrontForSlot]);

  const rotationRad = (totalDeg * Math.PI) / 180;

  return (
    <section className="solar-system mx-auto w-full max-w-[min(98vw,820px)]" aria-label="E solar system">
      <div
        id="solar-orbit-root"
        className="relative mx-auto h-[min(92vw,640px)] w-full max-w-[640px] touch-pan-y cursor-grab active:cursor-grabbing select-none"
        {...orbitHandlers}
        role="application"
        aria-roledescription="3D orbit"
        aria-label="Drag to spin the solar system. Click a planet to open its module."
      >
        {use3d ? (
          <WebGLBoundary
            onError={() => setUse3d(false)}
            fallback={
              <SolarSystem2DFallback
                merged={merged}
                activeId={activeId}
                totalDeg={totalDeg}
                onSelect={onSelect}
              />
            }
          >
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-cyan-400/50">
                  Loading 3D orbit…
                </div>
              }
            >
              <SolarSystemCanvas
                planets={scenePlanets}
                rotationRad={rotationRad}
                onSelect={onSelect}
                onWebGlLost={() => setUse3d(false)}
              />
            </Suspense>
          </WebGLBoundary>
        ) : (
          <SolarSystem2DFallback
            merged={merged}
            activeId={activeId}
            totalDeg={totalDeg}
            onSelect={onSelect}
          />
        )}

        <div className="pointer-events-none absolute inset-[18%] z-20 flex flex-col items-center justify-center gap-2">
          <div className="pointer-events-auto w-full max-w-[min(78%,400px)]">{sun}</div>
          {underSun && <div className="pointer-events-auto w-full max-w-[min(88%,480px)] px-1">{underSun}</div>}
        </div>
      </div>
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-400/45 px-2">
        {focusedId
          ? "One world at a time · back to solar system to choose another"
          : "Drag to spin the 3D orbit · click a planet · ask Iris to bring one forward"}
        {use3d ? "" : " · 2D fallback (WebGL unavailable)"}
      </p>
      {use3d && (
        <button
          type="button"
          className="mx-auto mt-1 block font-mono text-[9px] uppercase tracking-widest text-cyan-500/30 hover:text-cyan-400/60"
          onClick={() => setUse3d(false)}
        >
          Switch to flat orbit
        </button>
      )}
      {!use3d && (
        <button
          type="button"
          className="mx-auto mt-1 block font-mono text-[9px] uppercase tracking-widest text-cyan-500/40 hover:text-cyan-400/70"
          onClick={() => setUse3d(true)}
        >
          Try 3D again
        </button>
      )}
    </section>
  );
}
