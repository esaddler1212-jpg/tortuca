import type { ConversationPhase } from "../../../hooks/useConversation";

export function SonarOrbOverlay({ phase }: { phase: ConversationPhase }) {
  if (phase !== "listening" && phase !== "speaking") return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[0] flex items-center justify-center" aria-hidden>
      <div
        className={`absolute aspect-square w-[88%] rounded-full border border-cyan-400/30 ${
          phase === "listening" ? "animate-ping" : "animate-pulse"
        }`}
        style={{ animationDuration: phase === "listening" ? "2.4s" : "1.2s" }}
      />
      <div
        className="absolute aspect-square w-[72%] rounded-full border border-cyan-300/20 animate-ping"
        style={{ animationDuration: "3.6s", animationDelay: "0.4s" }}
      />
    </div>
  );
}