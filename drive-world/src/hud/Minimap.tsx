import type { HudSnapshot } from '../game-bridge';
import { LANDMARKS, VALLEJO_SAFEHOUSE } from '../landmark-registry';
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
  const visited = new Set(snap.progress?.visitedLandmarkIds ?? []);
  const next = snap.nextLandmark;

  return (
    <div className="minimap-wrap">
      <div className="minimap-title">Bay map</div>
      <svg width={SIZE} height={SIZE} className="minimap" aria-hidden>
        <rect x={0} y={0} width={SIZE} height={SIZE} className="minimap-bg" />
        {LANDMARKS.map((lm) => (
          <circle
            key={lm.id}
            cx={mapX(lm.x)}
            cy={mapY(lm.z)}
            r={visited.has(lm.id) ? 2.5 : 3.5}
            className={visited.has(lm.id) ? 'minimap-dot done' : 'minimap-dot'}
          />
        ))}
        <rect
          x={mapX(VALLEJO_SAFEHOUSE.x) - 4}
          y={mapY(VALLEJO_SAFEHOUSE.z) - 4}
          width={8}
          height={8}
          className="minimap-safehouse"
        />
        {next && (
          <line
            x1={mapX(snap.playerX)}
            y1={mapY(snap.playerZ)}
            x2={mapX(next.x)}
            y2={mapY(next.z)}
            className="minimap-route"
          />
        )}
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
