import type { HudSnapshot } from '../game-bridge';
import { CRUISE_VISTAS } from '../cruise-vistas';
import { TACO_TRUCKS } from '../city-taco-trucks';
import { LANDMARKS } from '../landmark-registry';
import { CITY_HUBS } from '../city-map-registry';
import { NAMED_STREETS } from '../street-registry';
import { homeServicePoint, resolveHomeSafehouse } from '../safehouse-registry';
import { GAS_STATIONS } from '../gas-stations';
import { DISTRICTS, FREEWAY_ROUTES, WORLD_HALF_M } from '../world-config';
import { TOKYO_MINIMAP_TITLE } from '../tokyo-ff-cars';
import { GHOST_SPRINT_CIRCUIT } from '../sprint-circuit-roster';
import { HANEDA_PAD, SFO_FLIGHT_GATE, TOKYO_CENTER, TOKYO_HALF_M, TOKYO_LANDMARKS, tokyoUnlockStatus } from '../tokyo-map';

const HALF = WORLD_HALF_M;

function mapX(wx: number, size: number): number {
  return ((wx + HALF) / (HALF * 2)) * size;
}
function mapY(wz: number, size: number): number {
  return ((HALF - wz) / (HALF * 2)) * size;
}

const T_HALF = TOKYO_HALF_M + 20;
function tX(wx: number, size: number): number {
  return ((wx - TOKYO_CENTER.x + T_HALF) / (T_HALF * 2)) * size;
}
function tY(wz: number, size: number): number {
  return ((T_HALF - (wz - TOKYO_CENTER.z)) / (T_HALF * 2)) * size;
}

export type BayMapProps = {
  snap: HudSnapshot;
  size?: number;
  showDistrictLabels?: boolean;
  className?: string;
};

function TokyoMapBody({ snap, size }: { snap: HudSnapshot; size: number }) {
  const visited = new Set(snap.progress?.tokyoLandmarkIds ?? []);
  const roads = Array.from({ length: 11 }, (_, i) => (i - 5) * 160);
  const route = snap.navRoutePoints ?? [];
  const ring = (480 / (T_HALF * 2)) * size;
  return (
    <>
      <rect x={0} y={0} width={size} height={size} className="minimap-bg" />
      <rect
        x={tX(TOKYO_CENTER.x + 660, size)}
        y={tY(TOKYO_CENTER.z - 660, size)}
        width={(160 / (T_HALF * 2)) * size}
        height={(160 / (T_HALF * 2)) * size}
        className="minimap-tokyo-water"
      />
      {roads.map((r) => (
        <g key={r}>
          <line x1={tX(TOKYO_CENTER.x + r, size)} y1={0} x2={tX(TOKYO_CENTER.x + r, size)} y2={size} className="minimap-tokyo-road" />
          <line x1={0} y1={tY(TOKYO_CENTER.z + r, size)} x2={size} y2={tY(TOKYO_CENTER.z + r, size)} className="minimap-tokyo-road" />
        </g>
      ))}
      <rect x={size / 2 - ring} y={size / 2 - ring} width={ring * 2} height={ring * 2} className="minimap-tokyo-ring" />
      <rect x={tX(HANEDA_PAD.x, size) - 4} y={tY(HANEDA_PAD.z, size) - 4} width={8} height={8} className="minimap-tokyo-pad" />
      {TOKYO_LANDMARKS.map((lm) => (
        <circle
          key={lm.id}
          cx={tX(lm.x, size)}
          cy={tY(lm.z, size)}
          r={visited.has(lm.id) ? 2.5 : 3.8}
          className={visited.has(lm.id) ? 'minimap-dot done' : 'minimap-dot'}
        />
      ))}
      {route.slice(0, -1).map((a, i) => {
        const b = route[i + 1]!;
        return <line key={`r-${i}`} x1={tX(a.x, size)} y1={tY(a.z, size)} x2={tX(b.x, size)} y2={tY(b.z, size)} className="minimap-route" />;
      })}
      <circle
        cx={tX(snap.playerX, size)}
        cy={tY(snap.playerZ, size)}
        r={5}
        className="minimap-player"
        transform={`rotate(${snap.yaw} ${tX(snap.playerX, size)} ${tY(snap.playerZ, size)})`}
      />
    </>
  );
}

function BayMapBody({ snap, size, showDistrictLabels }: { snap: HudSnapshot; size: number; showDistrictLabels: boolean }) {
  const tokyoReady = snap.progress ? tokyoUnlockStatus(snap.progress).unlocked : false;
  const home = snap.progress ? resolveHomeSafehouse(snap.progress) : null;
  const svc = home ? homeServicePoint(home) : null;
  const visited = new Set(snap.progress?.visitedLandmarkIds ?? []);
  const tacosFound = new Set(snap.progress?.tacoTrucksFound ?? []);
  const vistas = new Set(snap.progress?.visitedVistaIds ?? []);
  const next = snap.nextLandmark;
  const pulse = snap.atVista ? 4 + Math.sin((snap.vistaPulse ?? 0) * 4) * 2 : 0;

  return (
    <>
      <rect x={0} y={0} width={size} height={size} className="minimap-bg" />
      {FREEWAY_ROUTES.map((route, ri) =>
        route.slice(0, -1).map((a, i) => {
          const b = route[i + 1]!;
          return (
            <line
              key={`fw-${ri}-${i}`}
              x1={mapX(a.x, size)}
              y1={mapY(a.z, size)}
              x2={mapX(b.x, size)}
              y2={mapY(b.z, size)}
              className="minimap-freeway"
            />
          );
        })
      )}
      {(Object.keys(DISTRICTS) as (keyof typeof DISTRICTS)[]).map((id) => {
        const d = DISTRICTS[id];
        const x = (d.minX + d.maxX) / 2;
        const z = (d.minZ + d.maxZ) / 2;
        const w = ((d.maxX - d.minX) / (HALF * 2)) * size;
        const h = ((d.maxZ - d.minZ) / (HALF * 2)) * size;
        return (
          <rect
            key={id}
            x={mapX(x, size) - w / 2}
            y={mapY(z, size) - h / 2}
            width={w}
            height={h}
            className="minimap-district"
          />
        );
      })}
      {CITY_HUBS.map((hub) => (
        <circle
          key={hub.id}
          cx={mapX(hub.centerX, size)}
          cy={mapY(hub.centerZ, size)}
          r={(hub.radiusM / (HALF * 2)) * size}
          className="minimap-city-hub"
        />
      ))}
      {NAMED_STREETS.map((st) =>
        st.points.slice(0, -1).map((a, i) => {
          const b = st.points[i + 1]!;
          return (
            <line
              key={`${st.id}-${i}`}
              x1={mapX(a.x, size)}
              y1={mapY(a.z, size)}
              x2={mapX(b.x, size)}
              y2={mapY(b.z, size)}
              className="minimap-arterial"
            />
          );
        })
      )}
      {showDistrictLabels
        ? CITY_HUBS.map((hub) => (
            <text key={`lbl-${hub.id}`} x={mapX(hub.centerX, size)} y={mapY(hub.centerZ, size) - 6} className="minimap-district-label">
              {hub.label.split(' ')[0]}
            </text>
          ))
        : null}
      {CRUISE_VISTAS.map((v) => (
        <circle key={v.id} cx={mapX(v.x, size)} cy={mapY(v.z, size)} r={vistas.has(v.id) ? 2 : 2.8} className={vistas.has(v.id) ? 'minimap-vista done' : 'minimap-vista'} />
      ))}
      {TACO_TRUCKS.map((t) => (
        <rect
          key={`taco-${t.district}`}
          x={mapX(t.x, size) - (tacosFound.has(t.district) ? 2.5 : 3.5)}
          y={mapY(t.z, size) - (tacosFound.has(t.district) ? 2.5 : 3.5)}
          width={tacosFound.has(t.district) ? 5 : 7}
          height={tacosFound.has(t.district) ? 5 : 7}
          className={tacosFound.has(t.district) ? 'minimap-taco done' : 'minimap-taco'}
        />
      ))}
      {LANDMARKS.map((lm) => (
        <circle
          key={lm.id}
          cx={mapX(lm.x, size)}
          cy={mapY(lm.z, size)}
          r={visited.has(lm.id) ? 2.5 : 3.5}
          className={visited.has(lm.id) ? 'minimap-dot done' : 'minimap-dot'}
        />
      ))}
      {home ? <rect x={mapX(home.x, size) - 4} y={mapY(home.z, size) - 4} width={8} height={8} className="minimap-safehouse" /> : null}
      {svc ? (
        <circle cx={mapX(svc.x, size)} cy={mapY(svc.z, size)} r={4} className={svc.mode === 'valet' ? 'minimap-valet' : 'minimap-garage-door'} />
      ) : null}
      <rect
        x={mapX(SFO_FLIGHT_GATE.x, size) - 3.5}
        y={mapY(SFO_FLIGHT_GATE.z, size) - 3.5}
        width={7}
        height={7}
        transform={`rotate(45 ${mapX(SFO_FLIGHT_GATE.x, size)} ${mapY(SFO_FLIGHT_GATE.z, size)})`}
        className={tokyoReady ? 'minimap-tokyo-gate ready' : 'minimap-tokyo-gate'}
      />
      {(snap.ghostCircuitRoutes?.length
        ? snap.ghostCircuitRoutes
        : GHOST_SPRINT_CIRCUIT.map((s) => ({
            id: s.id,
            name: s.name,
            x1: s.start.x,
            z1: s.start.z,
            x2: s.finish.x,
            z2: s.finish.z,
            pbMs: 0
          }))
      ).map((route) => (
        <line
          key={`ghost-${route.id}`}
          x1={mapX(route.x1, size)}
          y1={mapY(route.z1, size)}
          x2={mapX(route.x2, size)}
          y2={mapY(route.z2, size)}
          className={route.pbMs > 0 ? 'minimap-ghost-circuit done' : 'minimap-ghost-circuit'}
        />
      ))}
      {GAS_STATIONS.map((g) => (
        <circle key={g.id} cx={mapX(g.x, size)} cy={mapY(g.z, size)} r={2.2} className="minimap-gas" />
      ))}
      {(() => {
        const routePts =
          snap.navRoutePoints && snap.navRoutePoints.length > 1
            ? snap.navRoutePoints
            : next
              ? [{ x: snap.playerX, z: snap.playerZ }, { x: next.x, z: next.z }]
              : [];
        return routePts.slice(0, -1).map((a, i) => {
          const b = routePts[i + 1]!;
          return (
            <line
              key={`route-${i}`}
              x1={mapX(a.x, size)}
              y1={mapY(a.z, size)}
              x2={mapX(b.x, size)}
              y2={mapY(b.z, size)}
              className="minimap-route"
            />
          );
        });
      })()}
      {pulse > 0 ? (
        <circle cx={mapX(snap.playerX, size)} cy={mapY(snap.playerZ, size)} r={pulse + 6} className="minimap-vista-pulse" />
      ) : null}
      <circle
        cx={mapX(snap.playerX, size)}
        cy={mapY(snap.playerZ, size)}
        r={5}
        className="minimap-player"
        transform={`rotate(${snap.yaw} ${mapX(snap.playerX, size)} ${mapY(snap.playerZ, size)})`}
      />
    </>
  );
}

export function BayMap({ snap, size = 168, showDistrictLabels = false, className }: BayMapProps) {
  const inTokyo = snap.inTokyo;
  return (
    <svg width={size} height={size} className={className ?? 'minimap'} aria-label={inTokyo ? TOKYO_MINIMAP_TITLE : 'Bay Area map'}>
      {inTokyo ? <TokyoMapBody snap={snap} size={size} /> : <BayMapBody snap={snap} size={size} showDistrictLabels={showDistrictLabels} />}
    </svg>
  );
}
