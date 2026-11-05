import { useEffect, useState } from "react";
import type { ConversationPhase } from "../../hooks/useConversation";

function useAnim(active: boolean) {
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

/** Oscilloscope-style bars for the Iris voice deck (desktop). */
export function VoiceWaveform({
  phase,
  className = "",
  bars = 40,
  interim = "",
}: {
  phase: ConversationPhase;
  className?: string;
  bars?: number;
  interim?: string;
}) {
  const t = useAnim(phase === "listening" || phase === "speaking" || phase === "thinking");
  const active = phase !== "idle";
  const live = phase === "listening" && interim.trim().length > 0;
  const h = 32;

  return (
    <svg
      viewBox={`0 0 ${bars * 5} ${h}`}
      className={`h-8 w-full min-w-[120px] ${className}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      {Array.from({ length: bars }, (_, i) => {
        const amp = active
          ? Math.abs(Math.sin(t * (live ? 9 : 7) + i * 0.35)) *
            (phase === "speaking" ? 0.7 : live ? 1 : phase === "thinking" ? 0.45 : 1)
          : 0.12;
        const bh = h * (0.1 + amp * 0.9);
        return (
          <rect
            key={i}
            x={i * 5 + 0.5}
            y={(h - bh) / 2}
            width={3.5}
            height={bh}
            fill="rgb(34 211 238)"
            opacity={0.35 + amp * 0.55}
            rx={0.5}
          />
        );
      })}
    </svg>
  );
}

const PHASES: { id: ConversationPhase; label: string }[] = [
  { id: "listening", label: "Listening" },
  { id: "thinking", label: "Thinking" },
  { id: "speaking", label: "Speaking" },
];

export function VoicePhasePills({ phase }: { phase: ConversationPhase }) {
  return (
    <div className="hidden flex-wrap gap-1.5 lg:flex" aria-hidden>
      {PHASES.map(({ id, label }) => {
        const active = phase === id;
        return (
          <span
            key={id}
            className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
              active
                ? "border-cyan-200/70 bg-cyan-400/15 text-cyan-50"
                : "border-cyan-500/25 text-cyan-500/55"
            }`}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
