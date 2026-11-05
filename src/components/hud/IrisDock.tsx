import type { Conversation } from "../../hooks/useConversation";
import { JarvisCinemaBar } from "./JarvisCinemaBar";

/**
 * Fixed Iris cinema bar while modules are open (or during an active voice session on home).
 */
export function IrisDock({
  show,
  convo,
  googleConnected,
}: {
  show: boolean;
  convo: Conversation;
  googleConnected: boolean;
}) {
  if (!show) return null;
  return (
    <div
      className="iris-dock fixed inset-x-0 z-40 px-2 pointer-events-none"
      style={{ bottom: "calc(var(--hud-tabbar-height) + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Iris voice"
    >
      <div className="pointer-events-auto mx-auto max-w-xl rounded-xl border border-cyan-400/35 bg-black/94 px-3 py-2.5 shadow-[0_0_28px_rgb(6_182_212/0.14)] backdrop-blur-xl">
        <JarvisCinemaBar convo={convo} googleConnected={googleConnected} onActivate={convo.tap} />
      </div>
    </div>
  );
}
