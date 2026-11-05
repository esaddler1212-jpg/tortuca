import type { Conversation } from "../../hooks/useConversation";
import { JarvisCinemaBar } from "./JarvisCinemaBar";

/**
 * Iris voice deck: slides up above the tab bar when opened from the header ring (in modules)
 * or while a voice session is active on home.
 */
export function IrisDock({
  show,
  convo,
  googleConnected,
  onDismiss,
}: {
  show: boolean;
  convo: Conversation;
  googleConnected: boolean;
  onDismiss?: () => void;
}) {
  if (!show) return null;
  return (
    <div
      className="iris-dock fixed inset-x-0 z-40 px-2 pointer-events-none animate-hud-sheet"
      style={{ bottom: "calc(var(--hud-tabbar-height) + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Iris voice"
    >
      <div className="iris-dock-panel pointer-events-auto mx-auto max-w-xl rounded-xl border border-cyan-400/35 bg-black/94 px-3 py-2.5 shadow-[0_0_28px_rgb(6_182_212/0.14)] backdrop-blur-xl lg:max-w-[1100px] lg:px-4 lg:py-3">
        <JarvisCinemaBar
          convo={convo}
          googleConnected={googleConnected}
          onActivate={convo.tap}
          onDismiss={onDismiss}
        />
      </div>
    </div>
  );
}
