import { useEffect, useState } from "react";
import type { ConversationPhase } from "../../../hooks/useConversation";

function useScanTime(active: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      setT((performance.now() - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return t;
}

/** Scaled cinema eye for the home core (cinema-eye orb style). */
export function CinemaFaceOrb({
  phase,
  lines,
  status,
}: {
  phase: ConversationPhase;
  lines: [string, string];
  status: "ok" | "degraded" | "offline";
}) {
  const t = useScanTime(phase !== "idle");
  const w = 400;
  const h = 280;
  const scanY = (t * 48) % h;
  const eyeX = phase === "listening" ? Math.sin(t * 5) * 6 : 0;
  const pulse = phase === "thinking" ? 0.45 + Math.sin(t * 4) * 0.35 : phase === "speaking" ? 0.85 + Math.sin(t * 10) * 0.15 : 1;
  const accent = status === "ok" ? "rgb(34 211 238)" : status === "degraded" ? "rgb(251 191 36)" : "rgb(248 113 113)";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="aspect-[10/7] w-full max-w-[420px]" aria-hidden>
      <rect x={8} y={8} width={w - 16} height={h - 16} fill="rgb(2 8 14 / 0.92)" stroke={accent} strokeOpacity={0.45} rx={12} />
      {Array.from({ length: 14 }, (_, i) => (
        <line
          key={i}
          x1={(i + 1) * (w / 15)}
          y1={16}
          x2={(i + 1) * (w / 15)}
          y2={h - 16}
          stroke="rgb(94 231 255 / 0.1)"
          strokeWidth={0.5}
        />
      ))}
      <line x1={20} y1={scanY} x2={w - 20} y2={scanY} stroke={accent} strokeWidth={1.2} opacity={0.5} />
      <circle cx={w / 2} cy={h / 2 - 10} r={72} fill="rgb(0 0 0 / 0.88)" stroke={accent} strokeWidth={2} />
      <ellipse cx={w / 2 + eyeX} cy={h / 2 - 10} rx={36} ry={24} fill={accent} fillOpacity={0.22} />
      <circle cx={w / 2 + eyeX} cy={h / 2 - 10} r={16 * pulse} fill={accent} opacity={phase === "idle" ? 0.55 : 1} />
      <text x={w / 2} y={h - 36} textAnchor="middle" fill={accent} fontSize={18} fontFamily="ui-monospace, monospace" letterSpacing="0.2em">
        {lines[0]}
      </text>
      <text x={w / 2} y={h - 14} textAnchor="middle" fill={accent} fillOpacity={0.85} fontSize={13} fontFamily="ui-monospace, monospace" letterSpacing="0.15em">
        {phase === "idle" ? lines[1] : phase.toUpperCase()}
      </text>
    </svg>
  );
}