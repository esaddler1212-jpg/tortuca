import { DISTRICTS, WORLD_HALF_M } from '../districts';

type Pin = { x: number; z: number; label?: string };

type Props = {
  heroX: number;
  heroZ: number;
  homePin?: Pin | null;
  arcPin?: Pin | null;
  findNextPin?: Pin | null;
};

const SIZE = 120;

export function Minimap({ heroX, heroZ, homePin, arcPin, findNextPin }: Props) {
  const half = WORLD_HALF_M;
  const toPx = (x: number, z: number) => ({
    left: ((x + half) / (half * 2)) * SIZE,
    top: ((z + half) / (half * 2)) * SIZE
  });
  const hero = toPx(heroX, heroZ);

  return (
    <div className="minimap hud-panel">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <rect width={SIZE} height={SIZE} fill="rgba(0,0,0,0.35)" rx={8} />
        {DISTRICTS.map((d) => {
          const c = toPx(d.center.x, d.center.z);
          return (
            <circle
              key={d.id}
              cx={c.left}
              cy={c.top}
              r={6}
              fill={`rgb(${Math.round(d.accent[0] * 255)},${Math.round(d.accent[1] * 255)},${Math.round(d.accent[2] * 255)})`}
              opacity={0.85}
            />
          );
        })}
        {findNextPin ? (
          <g className="minimap-find-next">
            <circle
              cx={toPx(findNextPin.x, findNextPin.z).left}
              cy={toPx(findNextPin.x, findNextPin.z).top}
              r={8}
              fill="rgba(245,200,66,0.25)"
              stroke="#f5c842"
              strokeWidth={2}
            />
            <text
              x={toPx(findNextPin.x, findNextPin.z).left}
              y={toPx(findNextPin.x, findNextPin.z).top + 4}
              textAnchor="middle"
              fontSize={10}
              fontWeight={800}
              fill="#f5c842"
            >
              {findNextPin.label ?? '→'}
            </text>
          </g>
        ) : null}
        {arcPin ? (
          <circle
            className="minimap-arc-pin"
            cx={toPx(arcPin.x, arcPin.z).left}
            cy={toPx(arcPin.x, arcPin.z).top}
            r={5}
            fill="none"
            stroke="#9ec4ff"
            strokeWidth={1.5}
          />
        ) : null}
        {homePin ? (
          <g className="minimap-home-h">
            <circle
              cx={toPx(homePin.x, homePin.z).left}
              cy={toPx(homePin.x, homePin.z).top}
              r={7}
              fill="rgba(255,220,120,0.35)"
              stroke="#ffe8a0"
              strokeWidth={1.5}
            />
            <text
              x={toPx(homePin.x, homePin.z).left}
              y={toPx(homePin.x, homePin.z).top + 4}
              textAnchor="middle"
              fontSize={9}
              fontWeight={700}
              fill="#ffe8a0"
            >
              {homePin.label ?? 'H'}
            </text>
          </g>
        ) : null}
        <circle cx={hero.left} cy={hero.top} r={4} fill="#fff" />
      </svg>
    </div>
  );
}
