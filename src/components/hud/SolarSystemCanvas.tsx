import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import type { SolarPlanetId } from "../../../shared/solarPlanets";
import { SolarSystemScene, type ScenePlanet } from "./SolarSystemScene";

export function SolarSystemCanvas({
  planets,
  rotationRad,
  onSelect,
  onWebGlLost,
}: {
  planets: ScenePlanet[];
  rotationRad: number;
  onSelect: (id: SolarPlanetId) => void;
  onWebGlLost?: () => void;
}) {
  return (
    <Canvas
      className="!absolute inset-0 touch-none"
      camera={{ position: [0, 4.2, 10.5], fov: 42, near: 0.1, far: 100 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.75]}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onWebGlLost?.();
        });
      }}
    >
      <Suspense fallback={null}>
        <SolarSystemScene planets={planets} rotationRad={rotationRad} onSelect={onSelect} />
      </Suspense>
    </Canvas>
  );
}
