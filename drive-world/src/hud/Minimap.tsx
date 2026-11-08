import type { HudSnapshot } from '../game-bridge';
import { CRUISE_VISTAS } from '../cruise-vistas';
import { LANDMARKS } from '../landmark-registry';
import { NAMED_STREETS } from '../street-registry';
import { homeServicePoint, resolveHomeSafehouse } from '../safehouse-registry';
import { WORLD_HALF_M } from '../world-config';

const SIZE = 168;
const HALF = WORLD_HALF_M;

function mapX(wx: number): number {
  return ((wx + HALF) / (HALF * 2)) * SIZE;
}
function mapY(wz: number): number {
  return ((HALF - wz) / (HALF * 2)) * SIZE;
}

export function Minimap({ snap }: { snap: HudSnapshot }) {
  const home = snap.progress ? resolveHomeSafehouse(snap.progress) : null;
  const svc = home ? homeServicePoint(home) : null;
  const visited = new Set(snap.progress?.visitedLandmarkIds ?? []);
  const vistas = new Set(snap.progress?.visitedVistaIds ?? []);
  const next = snap.nextLandmark;
  const pulse = snap.atVista ? 4 + Math.sin((snap.vistaPulse ?? 0) * 4) * 2 : 0;

  return (
    <div className="minimap-wrap">
      <div className="minimap-title">City Nights map</div>
      <svg width={SIZE} height={SIZE} className="minimap" aria-hidden>
        <rect x={0} y={0} width={SIZE} height={SIZE} className="minimap-bg" />
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
        {next && (
          <line
            x1={mapX(snap.playerX)}
            y1={mapY(snap.playerZ)}
            x2={mapX(next.x)}
            y2={mapY(next.z)}
            className="minimap-route"
          />
        )}
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
