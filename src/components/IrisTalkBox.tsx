import type { Conversation } from "../hooks/useConversation";
import { JarvisCinemaBar } from "./hud/JarvisCinemaBar";

/** Inline Iris voice panel (Today desktop — beside Do today). */
export function IrisTalkBox({
  convo,
  googleConnected,
  onDismiss,
}: {
  convo: Conversation;
  googleConnected: boolean;
  onDismiss?: () => void;
}) {
  return (
    <aside
      className="iris-talk-box rounded-lg border border-cyan-400/35 bg-black/50 p-4 shadow-[0_0_24px_rgb(6_182_212/0.12)] backdrop-blur-sm"
      aria-label="Iris voice"
    >
      <p className="hud-label mb-3 text-cyan-300/90">Iris</p>
      <JarvisCinemaBar
        layout="box"
        convo={convo}
        googleConnected={googleConnected}
        onActivate={convo.tap}
        onDismiss={onDismiss}
      />
    </aside>
  );
}
