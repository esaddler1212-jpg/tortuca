import { Check, X } from "lucide-react";
import type { Conversation } from "../../hooks/useConversation";
import { useVoiceSignal } from "../../hooks/useVoiceOutput";

const STATUS: Record<Conversation["phase"], string> = {
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking",
  idle: "Your turn · tap to talk",
};

/**
 * Iris, always in reach: a small ring above the tab bar whenever her main ring
 * is off-screen (inside a module, scrolled down, under More). Tap it to talk,
 * tap again to interrupt or stop listening, same as the big ring. During a
 * conversation a status pill shows what she's doing, with End and the
 * "save this conversation?" choice.
 */
export function IrisDock({ convo, visible }: { convo: Conversation; visible: boolean }) {
  const voice = useVoiceSignal();
  const speaking = voice.speaking || convo.phase === "speaking";
  const phase = speaking ? "speaking" : convo.phase;
  if (!visible) return null;

  const pill = "flex min-h-[44px] items-center gap-2 rounded-full border px-3 font-mono text-[11px] uppercase tracking-[0.14em]";
  return (
    <div
      className="fixed right-3 z-30 flex items-center justify-end gap-2"
      style={{ bottom: "calc(64px + env(safe-area-inset-bottom))", left: convo.active ? "0.75rem" : undefined }}
    >
      {convo.active && (
        <div className="hud-glass flex min-w-0 flex-1 items-center justify-end gap-2 rounded-full px-2 py-1" style={{ background: "rgb(2 7 11 / 0.9)" }} aria-live="polite">
          {convo.offerSave ? (
            <>
              <span className="truncate px-1 text-xs text-cyan-100">Save to memos?</span>
              <button type="button" className={`${pill} border-amber-300/70 text-amber-200`} onClick={convo.saveTranscript}>
                <Check className="h-3.5 w-3.5" aria-hidden /> Save
              </button>
              <button type="button" className={`${pill} border-cyan-400/30 text-cyan-200`} onClick={convo.skipSave}>
                No
              </button>
            </>
          ) : (
            <>
              <span className={`min-w-0 truncate px-1 font-mono text-[11px] uppercase tracking-[0.14em] ${convo.error ? "text-amber-300" : "text-cyan-100"}`}>
                {convo.error ?? STATUS[phase]}
              </span>
              <button type="button" className={`${pill} border-cyan-400/30 text-cyan-200`} onClick={convo.end} aria-label="End conversation">
                <X className="h-3.5 w-3.5" aria-hidden /> End
              </button>
            </>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={convo.tap}
        aria-label={convo.active ? `Iris is ${STATUS[phase].toLowerCase()}. Tap to ${phase === "listening" ? "stop listening" : "talk"}` : "Talk to Iris"}
        className="hud-glass relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-cyan-300"
        style={{ background: "rgb(2 7 11 / 0.9)", boxShadow: speaking ? "0 0 22px rgb(94 231 255 / 0.55)" : undefined }}
      >
        <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full" fill="none" aria-hidden>
          <g
            className={phase === "thinking" ? "animate-hud-spin" : phase === "listening" ? "animate-hud-listen" : "animate-hud-pulse"}
            style={{ transformOrigin: "28px 28px", animationDuration: phase === "thinking" ? "1.2s" : undefined }}
          >
            <circle cx="28" cy="28" r="23" stroke="currentColor" strokeOpacity={0.5} strokeDasharray={phase === "thinking" ? "10 6" : "2 4"} />
          </g>
          <circle cx="28" cy="28" r="16" stroke="currentColor" strokeWidth={phase === "listening" ? 2.5 : 1.5} />
          <circle key={voice.tick} cx="28" cy="28" r={speaking ? 9 + (voice.tick % 3) : 8} fill="currentColor" fillOpacity={speaking ? 0.45 : 0.22} />
        </svg>
        <span className="relative font-mono text-[9px] tracking-[0.2em] text-cyan-50">IRIS</span>
      </button>
    </div>
  );
}
