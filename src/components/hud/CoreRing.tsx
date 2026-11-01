interface Props {
  /** Two short lines in the centre, e.g. ["ALFRED", "ONLINE"] */
  lines: [string, string];
  status: "ok" | "degraded" | "offline";
}

const COLOR: Record<Props["status"], string> = {
  ok: "rgb(var(--accent-400))", // follows the focus-mode theme
  degraded: "#fbbf24",
  offline: "#f87171",
};

/** Large animated core ring at the centre of the operator console. */
export function CoreRing({ lines, status }: Props) {
  const color = COLOR[status];
  const c = "currentColor";
  const spokes = [0, 60, 120, 180, 240, 300];
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[420px] [container-type:inline-size]"
      style={{ color }}
      aria-label={`${lines[0]} ${lines[1]}`}
      role="img"
    >
      <svg viewBox="0 0 400 400" className="h-full w-full" fill="none" aria-hidden>
        <defs>
          <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={c} stopOpacity="0.18" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="190" fill="url(#core-glow)" />
        {/* outer dashed ring, slow spin */}
        <g className="animate-hud-spin" style={{ transformOrigin: "200px 200px", animationDuration: "40s" }}>
          <circle cx="200" cy="200" r="188" stroke={c} strokeOpacity="0.55" strokeWidth="2" strokeDasharray="10 8" />
        </g>
        <circle cx="200" cy="200" r="166" stroke={c} strokeOpacity="0.35" strokeWidth="1.5" />
        {/* accent ticks orbiting */}
        <g className="animate-hud-spin" style={{ transformOrigin: "200px 200px", animationDuration: "14s" }}>
          <line x1="200" y1="28" x2="200" y2="52" stroke={c} strokeWidth="5" strokeLinecap="round" transform="rotate(-30 200 200)" />
          <line x1="200" y1="348" x2="200" y2="372" stroke={c} strokeWidth="5" strokeLinecap="round" transform="rotate(-30 200 200)" />
        </g>
        {spokes.map((deg) => (
          <line
            key={deg}
            x1="200"
            y1="34"
            x2="200"
            y2="144"
            stroke={c}
            strokeOpacity="0.22"
            strokeWidth="1"
            transform={`rotate(${deg} 200 200)`}
          />
        ))}
        <circle cx="200" cy="200" r="118" stroke={c} strokeOpacity="0.4" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="56" stroke={c} strokeOpacity="0.85" strokeWidth="2.5" className="animate-hud-pulse" />
        <circle cx="200" cy="200" r="48" fill="#000000" fillOpacity="0.8" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-display text-[4cqw] leading-tight tracking-[0.15em]" style={{ color: c, textShadow: `0 0 12px ${c}` }}>
          {lines[0]}
        </span>
        <span className="font-display text-[4cqw] leading-tight tracking-[0.15em]" style={{ color: c, textShadow: `0 0 12px ${c}` }}>
          {lines[1]}
        </span>
      </div>
    </div>
  );
}
