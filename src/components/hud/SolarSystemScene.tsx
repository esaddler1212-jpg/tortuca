import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Stars } from "@react-three/drei";
import type { Group, Mesh } from "three";
import type { SolarPlanetDef, SolarPlanetId } from "../../../shared/solarPlanets";

export type ScenePlanet = {
  def: SolarPlanetDef;
  badge?: number;
  alert?: boolean;
  active: boolean;
};

const ORBIT_RADIUS = 5.2;
const ORBIT_TILT = 0.52;

function OrbitRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.015, 8, 128]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.22} />
    </mesh>
  );
}

function SunGlow() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.12} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.18} />
      </mesh>
      <pointLight intensity={2.4} color="#67e8f9" distance={14} decay={2} />
    </group>
  );
}

function PlanetNode({
  planet,
  angle,
  onSelect,
}: {
  planet: ScenePlanet;
  angle: number;
  onSelect: (id: SolarPlanetId) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const x = Math.cos(angle) * ORBIT_RADIUS;
  const z = Math.sin(angle) * ORBIT_RADIUS;
  const { def, active, alert, badge } = planet;

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <group position={[x, 0, z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(def.id);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
        scale={active ? 1.2 : 1}
      >
        <sphereGeometry args={[0.32, 28, 28]} />
        <meshStandardMaterial
          color={def.color}
          emissive={def.color}
          emissiveIntensity={active ? 1.1 : alert ? 0.75 : 0.45}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      <Html center distanceFactor={6} style={{ pointerEvents: "none", userSelect: "none" }}>
        <span
          className={`font-mono text-[9px] uppercase tracking-wider whitespace-nowrap px-1 ${
            active ? "text-cyan-100" : "text-cyan-200/80"
          }`}
        >
          {def.short}
          {badge != null && badge > 0 && (
            <span className="ml-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[8px] font-bold text-black">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </span>
      </Html>
    </group>
  );
}

export function SolarSystemScene({
  planets,
  rotationRad,
  onSelect,
}: {
  planets: ScenePlanet[];
  rotationRad: number;
  onSelect: (id: SolarPlanetId) => void;
}) {
  const orbitRef = useRef<Group>(null);
  const count = planets.length;

  const angles = useMemo(
    () => planets.map((_, i) => (i / Math.max(count, 1)) * Math.PI * 2),
    [planets, count],
  );

  useFrame(() => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y = rotationRad;
    }
  });

  return (
    <>
      <color attach="background" args={["#00000000"]} />
      <ambientLight intensity={0.15} />
      <Stars radius={80} depth={40} count={1200} factor={3} saturation={0} fade speed={0.4} />
      <SunGlow />
      <group rotation={[ORBIT_TILT, 0, 0]}>
        <OrbitRing radius={ORBIT_RADIUS} />
        <group ref={orbitRef}>
          {planets.map((planet, i) => (
            <PlanetNode key={planet.def.id} planet={planet} angle={angles[i]} onSelect={onSelect} />
          ))}
        </group>
      </group>
    </>
  );
}
