import { DISTRICTS, WORLD_HALF_M } from '../districts';

type Props = {
  heroX: number;
  heroZ: number;
};

const SIZE = 120;

export function Minimap({ heroX, heroZ }: Props) {
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
        <circle cx={hero.left} cy={hero.top} r={4} fill="#fff" />
      </svg>
    </div>
  );
}
