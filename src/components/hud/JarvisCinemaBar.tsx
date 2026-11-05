import { useEffect, useMemo, useState } from "react";
import type { Conversation, ConversationPhase } from "../../hooks/useConversation";
import { X, Check } from "lucide-react";

const STATUS: Record<ConversationPhase, string> = {
  idle: "STANDBY",
  listening: "MIC LIVE",
  thinking: "PROCESSING",
  speaking: "VOICE OUT",
};

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

function CinemaFace({ phase }: { phase: ConversationPhase }) {
  const t = useScanTime(phase !== "idle");
  const w = 320;
  const h = 56;
  const scanY = (t * 36) % h;
  const eyeX = phase === "listening" ? Math.sin(t * 5) * 3 : 0;
  const pulse = phase === "thinking" ? 0.45 + Math.sin(t * 4) * 0.35 : phase === "speaking" ? 0.85 + Math.sin(t * 10) * 0.15 : 1;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full max-w-[320px] shrink-0" aria-hidden>
      <rect x={0.5} y={0.5} width={w - 1} height={h - 1} fill="rgb(2 8 14 / 0.85)" stroke="rgb(94 231 255 / 0.35)" rx={4} />
      {Array.from({ length: 10 }, (_, i) => (
        <line
          key={i}
          x1={(i + 1) * (w / 11)}
          y1={4}
          x2={(i + 1) * (w / 11)}
          y2={h - 4}
          stroke="rgb(94 231 255 / 0.12)"
          strokeWidth={0.5}
        />
      ))}
      <line x1={6} y1={scanY} x2={w - 6} y2={scanY} stroke="rgb(34 211 238)" strokeWidth={1} opacity={0.55} className="iris-cinema-scan" />
      <circle cx={w / 2} cy={h / 2} r={20} fill="rgb(0 0 0 / 0.9)" stroke="rgb(34 211 238)" strokeWidth={1.5} />
      <ellipse cx={w / 2 + eyeX} cy={h / 2} rx={12} ry={8} fill="rgb(34 211 238 / 0.2)" />
      <circle cx={w / 2 + eyeX} cy={h / 2} r={5 * pulse} fill="rgb(34 211 238)" opacity={phase === "idle" ? 0.5 : 1} />
      <circle cx={w / 2 + eyeX + 2} cy={h / 2 - 2} r={1.5} fill="rgb(0 0 0 / 0.8)" />
    </svg>
  );
}

function subtitleFor(convo: Conversation, googleConnected: boolean): string {
  if (convo.error) return convo.error;
  if (!googleConnected && convo.active) return "Connect Google in Settings for Iris's brain.";
  if (convo.offerSave) return "Save this conversation to Memos?";
  if (convo.phase === "listening" && convo.interim.trim()) return convo.interim.trim();
  if (convo.phase === "listening") return "Listening…";
  if (convo.phase === "thinking") return "One sec — checking for you.";
  if (convo.phase === "speaking") {
    const last = [...convo.turns].reverse().find((t) => t.role === "assistant" && !t.brief);
    return last?.content.slice(0, 140) ?? "…";
  }
  if (convo.pendingGreeting) return "Iris has your brief ready · tap to start";
  if (convo.active) return "Your turn · tap to speak";
  return "Tap Iris to talk";
}

/** Iron Man–style cinema strip: face, status, subtitle, talk / end controls. */
export function JarvisCinemaBar({
  convo,
  googleConnected,
  onActivate,
}: {
  convo: Conversation;
  googleConnected: boolean;
  onActivate: () => void;
}) {
  const subtitle = useMemo(() => subtitleFor(convo, googleConnected), [convo, googleConnected]);
  const chip =
    "inline-flex min-h-[44px] items-center gap-1 rounded-full border border-cyan-400/30 px-3 py-1 text-[10px] font-mono uppercase tracking-wider";

  return (
    <div className="iris-cinema-bar w-full space-y-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onActivate}
          className="shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          aria-label={
            convo.pendingGreeting
              ? "Tap to start: Iris has your brief ready"
              : convo.phase === "listening"
                ? "Stop listening"
                : "Talk to Iris"
          }
        >
          <CinemaFace phase={convo.phase} />
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-cyan-400/80">{STATUS[convo.phase]}</p>
          <p className="line-clamp-2 text-left text-[13px] leading-snug text-cyan-50/95">{subtitle}</p>
        </div>
      </div>
      {convo.active && (
        <div className="flex flex-wrap items-center justify-start gap-2 pl-1">
          {convo.offerSave ? (
            <>
              <button type="button" className={`${chip} border-amber-400/50 text-amber-200`} onClick={convo.saveTranscript}>
                <Check className="h-3 w-3" aria-hidden /> Save
              </button>
              <button type="button" className={`${chip} text-cyan-300/80`} onClick={convo.skipSave}>
                No
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`${chip} ${convo.phase === "listening" ? "border-cyan-200 text-cyan-50" : "text-cyan-200"}`}
                onClick={onActivate}
              >
                {convo.phase === "listening" ? "Stop mic" : "Talk"}
              </button>
              <button type="button" className={`${chip} text-cyan-300/70`} onClick={convo.end} aria-label="End conversation">
                <X className="h-3 w-3" aria-hidden /> End
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
