import { useVoiceSignal } from "../../hooks/useVoiceOutput";

interface Props {
  /** Two short lines in the centre, e.g. ["ALFRED", "ONLINE"] */
  lines: [string, string];
  status: "ok" | "degraded" | "offline";
  /** Conversation phase: the ring listens, thinks and speaks. */
  phase?: "idle" | "listening" | "thinking" | "speaking";
  /** Bumps when Alfred's reply arrives (one burst ripple). */
  replyTick?: number;
  /** Tap the ring to talk to Alfred. */
  onActivate?: () => void;
  /** A conversation is open (idle means "your turn"). */
  active?: boolean;
}

const COLOR: Record<Props["status"], string> = {
  ok: "rgb(var(--accent-400))", // follows the focus-mode theme
  degraded: "#fbbf24",
  offline: "#f87171",
};

/** Large animated core ring at the centre of the operator console. */
export function CoreRing({ lines, status, phase = "idle", replyTick = 0, onActivate, active = false }: Props) {
  const color = COLOR[status];
  const c = "currentColor";
  // Alfred's "face": the core glows and ripples with each word while he speaks.
  const voice = useVoiceSignal();
  const talking = voice.speaking || phase === "speaking";
  const listening = phase === "listening";
  const thinking = phase === "thinking";
  const label = talking ? "SPEAKING" : thinking ? "THINKING" : listening ? "LISTENING" : active ? "YOUR TURN" : lines[1];
  const spokes = [0, 60, 120, 180, 240, 300];
  return (
    <div
      className={`relative mx-auto aspect-square w-full max-w-[420px] [container-type:inline-size] ${onActivate ? "cursor-pointer select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-alfred-gold" : ""}`}
      style={{ color, WebkitTapHighlightColor: "transparent" }}
      aria-label={onActivate ? (active ? `Alfred is ${label.toLowerCase()}. Tap to ${listening ? "stop listening" : "talk"}` : "Talk to Alfred") : `${lines[0]} ${lines[1]}`}
      role={onActivate ? "button" : "img"}
      tabIndex={onActivate ? 0 : undefined}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (onActivate && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onActivate();
        }
      }}
    >
      <svg viewBox="0 0 400 400" className="h-full w-full" fill="none" aria-hidden>
        <defs>
          <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={c} stopOpacity="0.18" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="190" fill="url(#core-glow)" className={talking ? "animate-hud-talk-glow" : ""} style={{ transformOrigin: "200px 200px" }} />
        {/* outer dashed ring, slow spin */}
        <g className="animate-hud-spin" style={{ transformOrigin: "200px 200px", animationDuration: thinking ? "2.5s" : listening ? "16s" : "40s" }}>
          <circle cx="200" cy="200" r="188" stroke={c} strokeOpacity="0.55" strokeWidth="2" strokeDasharray="10 8" />
        </g>
        <circle cx="200" cy="200" r="166" stroke={c} strokeOpacity="0.35" strokeWidth="1.5" />
        {/* accent ticks orbiting */}
        <g className="animate-hud-spin" style={{ transformOrigin: "200px 200px", animationDuration: thinking ? "1.2s" : "14s", animationDirection: thinking ? "reverse" : "normal" }}>
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
        {/* reply burst: one big ripple when Alfred's answer lands */}
        {replyTick > 0 && (
          <circle key={`burst-${replyTick}`} cx="200" cy="200" r="118" stroke={c} strokeWidth="4" className="animate-hud-burst" style={{ transformOrigin: "200px 200px" }} />
        )}
        {listening && (
          <circle cx="200" cy="200" r="80" stroke={c} strokeWidth="2" strokeDasharray="4 6" className="animate-hud-listen" style={{ transformOrigin: "200px 200px" }} />
        )}
        <circle
          cx="200"
          cy="200"
          r="56"
          stroke={c}
          strokeOpacity={listening || thinking ? 1 : 0.85}
          strokeWidth={listening ? 4 : 2.5}
          className={talking ? "" : listening ? "animate-hud-listen" : "animate-hud-pulse"}
          style={{ transformOrigin: "200px 200px" }}
        />
        {talking && (
          <circle
            key={voice.tick}
            cx="200"
            cy="200"
            r="56"
            stroke={c}
            strokeWidth="3"
            className="animate-hud-word"
            style={{ transformOrigin: "200px 200px" }}
          />
        )}
        <circle cx="200" cy="200" r="48" fill="#000000" fillOpacity="0.8" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-display text-[4cqw] leading-tight tracking-[0.15em]" style={{ color: c, textShadow: `0 0 12px ${c}` }}>
          {lines[0]}
        </span>
        <span className="font-display text-[3.4cqw] leading-tight tracking-[0.12em]" style={{ color: c, textShadow: `0 0 12px ${c}` }}>
          {label}
        </span>
      </div>
    </div>
  );
}
