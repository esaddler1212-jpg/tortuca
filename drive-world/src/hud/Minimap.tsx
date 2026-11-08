import type { HudSnapshot } from '../game-bridge';
import { CRUISE_VISTAS } from '../cruise-vistas';
import { TACO_TRUCKS } from '../city-taco-trucks';
import { LANDMARKS } from '../landmark-registry';
import { CITY_HUBS } from '../city-map-registry';
import { NAMED_STREETS } from '../street-registry';
import { homeServicePoint, resolveHomeSafehouse } from '../safehouse-registry';
import { GAS_STATIONS } from '../gas-stations';
import { WORLD_HALF_M } from '../world-config';
import { TOKYO_MINIMAP_TITLE } from '../tokyo-ff-cars';
import { HANEDA_PAD, SFO_FLIGHT_GATE, TOKYO_CENTER, TOKYO_HALF_M, TOKYO_LANDMARKS, tokyoUnlockStatus } from '../tokyo-map';

const SIZE = 168;
const HALF = WORLD_HALF_M;

function mapX(wx: number): number {
  return ((wx + HALF) / (HALF * 2)) * SIZE;
}
function mapY(wz: number): number {
  return ((HALF - wz) / (HALF * 2)) * SIZE;
}

const T_HALF = TOKYO_HALF_M + 20;
function tX(wx: number): number {
  return ((wx - TOKYO_CENTER.x + T_HALF) / (T_HALF * 2)) * SIZE;
}
function tY(wz: number): number {
  return ((T_HALF - (wz - TOKYO_CENTER.z)) / (T_HALF * 2)) * SIZE;
}

function TokyoMinimap({ snap }: { snap: HudSnapshot }) {
  const visited = new Set(snap.progress?.tokyoLandmarkIds ?? []);
  const roads = Array.from({ length: 11 }, (_, i) => (i - 5) * 160);
  const route = snap.navRoutePoints ?? [];
  const ring = (480 / (T_HALF * 2)) * SIZE;
  return (
    <div className="minimap-wrap">
      <div className="minimap-title">{TOKYO_MINIMAP_TITLE}</div>
      <svg width={SIZE} height={SIZE} className="minimap" aria-hidden>
        <rect x={0} y={0} width={SIZE} height={SIZE} className="minimap-bg" />
        <rect
          x={tX(TOKYO_CENTER.x + 660)}
          y={tY(TOKYO_CENTER.z - 660)}
          width={(160 / (T_HALF * 2)) * SIZE}
          height={(160 / (T_HALF * 2)) * SIZE}
          className="minimap-tokyo-water"
        />
        {roads.map((r) => (
          <g key={r}>
            <line x1={tX(TOKYO_CENTER.x + r)} y1={0} x2={tX(TOKYO_CENTER.x + r)} y2={SIZE} className="minimap-tokyo-road" />
            <line x1={0} y1={tY(TOKYO_CENTER.z + r)} x2={SIZE} y2={tY(TOKYO_CENTER.z + r)} className="minimap-tokyo-road" />
          </g>
        ))}
        <rect
          x={SIZE / 2 - ring}
          y={SIZE / 2 - ring}
          width={ring * 2}
          height={ring * 2}
          className="minimap-tokyo-ring"
        />
        <rect x={tX(HANEDA_PAD.x) - 4} y={tY(HANEDA_PAD.z) - 4} width={8} height={8} className="minimap-tokyo-pad" />
        {TOKYO_LANDMARKS.map((lm) => (
          <circle
            key={lm.id}
            cx={tX(lm.x)}
            cy={tY(lm.z)}
            r={visited.has(lm.id) ? 2.5 : 3.8}
            className={visited.has(lm.id) ? 'minimap-dot done' : 'minimap-dot'}
          />
        ))}
        {route.slice(0, -1).map((a, i) => {
          const b = route[i + 1]!;
          return <line key={`r-${i}`} x1={tX(a.x)} y1={tY(a.z)} x2={tX(b.x)} y2={tY(b.z)} className="minimap-route" />;
        })}
        <circle
          cx={tX(snap.playerX)}
          cy={tY(snap.playerZ)}
          r={5}
          className="minimap-player"
          transform={`rotate(${snap.yaw} ${tX(snap.playerX)} ${tY(snap.playerZ)})`}
        />
      </svg>
    </div>
  );
}

export function Minimap({ snap }: { snap: HudSnapshot }) {
  if (snap.inTokyo) return <TokyoMinimap snap={snap} />;
  const tokyoReady = snap.progress ? tokyoUnlockStatus(snap.progress).unlocked : false;
  const home = snap.progress ? resolveHomeSafehouse(snap.progress) : null;
  const svc = home ? homeServicePoint(home) : null;
  const visited = new Set(snap.progress?.visitedLandmarkIds ?? []);
  const tacosFound = new Set(snap.progress?.tacoTrucksFound ?? []);
  const vistas = new Set(snap.progress?.visitedVistaIds ?? []);
  const next = snap.nextLandmark;
  const pulse = snap.atVista ? 4 + Math.sin((snap.vistaPulse ?? 0) * 4) * 2 : 0;

  return (
    <div className="minimap-wrap">
      <div className="minimap-title">City Nights map</div>
      <svg width={SIZE} height={SIZE} className="minimap" aria-hidden>
        <rect x={0} y={0} width={SIZE} height={SIZE} className="minimap-bg" />
        {CITY_HUBS.map((hub) => (
          <circle
            key={hub.id}
            cx={mapX(hub.centerX)}
            cy={mapY(hub.centerZ)}
            r={(hub.radiusM / (HALF * 2)) * SIZE}
            className="minimap-city-hub"
          />
        ))}
        {NAMED_STREETS.map((st) =>
          st.points.slice(0, -1).map((a, i) => {
            const b = st.points[i + 1]!;
            return (
              <line
                key={`${st.id}-${i}`}
                x1={mapX(a.x)}
                y1={mapY(a.z)}
                x2={mapX(b.x)}
                y2={mapY(b.z)}
                className="minimap-arterial"
              />
            );
          })
        )}
        {CRUISE_VISTAS.map((v) => (
          <circle
            key={v.id}
            cx={mapX(v.x)}
            cy={mapY(v.z)}
            r={vistas.has(v.id) ? 2 : 2.8}
            className={vistas.has(v.id) ? 'minimap-vista done' : 'minimap-vista'}
          />
        ))}
        {TACO_TRUCKS.map((t) => (
          <rect
            key={`taco-${t.district}`}
            x={mapX(t.x) - (tacosFound.has(t.district) ? 2.5 : 3.5)}
            y={mapY(t.z) - (tacosFound.has(t.district) ? 2.5 : 3.5)}
            width={tacosFound.has(t.district) ? 5 : 7}
            height={tacosFound.has(t.district) ? 5 : 7}
            className={tacosFound.has(t.district) ? 'minimap-taco done' : 'minimap-taco'}
          />
        ))}
        {LANDMARKS.map((lm) => (
          <circle
            key={lm.id}
            cx={mapX(lm.x)}
            cy={mapY(lm.z)}
            r={visited.has(lm.id) ? 2.5 : 3.5}
            className={visited.has(lm.id) ? 'minimap-dot done' : 'minimap-dot'}
          />
        ))}
        {home ? (
          <rect
            x={mapX(home.x) - 4}
            y={mapY(home.z) - 4}
            width={8}
            height={8}
            className="minimap-safehouse"
          />
        ) : null}
        {svc ? (
          <circle
            cx={mapX(svc.x)}
            cy={mapY(svc.z)}
            r={4}
            className={svc.mode === 'valet' ? 'minimap-valet' : 'minimap-garage-door'}
          />
        ) : null}
        <rect
          x={mapX(SFO_FLIGHT_GATE.x) - 3.5}
          y={mapY(SFO_FLIGHT_GATE.z) - 3.5}
          width={7}
          height={7}
          transform={`rotate(45 ${mapX(SFO_FLIGHT_GATE.x)} ${mapY(SFO_FLIGHT_GATE.z)})`}
          className={tokyoReady ? 'minimap-tokyo-gate ready' : 'minimap-tokyo-gate'}
        />
        {GAS_STATIONS.map((g) => (
          <circle
            key={g.id}
            cx={mapX(g.x)}
            cy={mapY(g.z)}
            r={2.2}
            className="minimap-gas"
          />
        ))}
        {(() => {
          const routePts =
            snap.navRoutePoints && snap.navRoutePoints.length > 1
              ? snap.navRoutePoints
              : next
                ? [
                    { x: snap.playerX, z: snap.playerZ },
                    { x: next.x, z: next.z }
                  ]
                : [];
          return routePts.slice(0, -1).map((a, i) => {
            const b = routePts[i + 1]!;
            return (
              <line
                key={`route-${i}`}
                x1={mapX(a.x)}
                y1={mapY(a.z)}
                x2={mapX(b.x)}
                y2={mapY(b.z)}
                className="minimap-route"
              />
            );
          });
        })()}
        {pulse > 0 ? (
          <circle
            cx={mapX(snap.playerX)}
            cy={mapY(snap.playerZ)}
            r={pulse + 6}
            className="minimap-vista-pulse"
          />
        ) : null}
        <circle
          cx={mapX(snap.playerX)}
          cy={mapY(snap.playerZ)}
          r={5}
          className="minimap-player"
          transform={`rotate(${snap.yaw} ${mapX(snap.playerX)} ${mapY(snap.playerZ)})`}
        />
      </svg>
    </div>
  );
}
