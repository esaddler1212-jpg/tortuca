import type { ReactNode } from "react";
import type { Conversation } from "../../hooks/useConversation";
import { ConversationCaptions } from "../ConversationPanel";

/**
 * Fixed Iris controls while a module tab is open — stays above the bottom tab bar
 * so you can talk to Iris without scrolling back to the shrunken core at the top.
 */
export function IrisDock({
  show,
  core,
  convo,
  googleConnected,
}: {
  show: boolean;
  core: ReactNode;
  convo: Conversation;
  googleConnected: boolean;
}) {
  if (!show) return null;
  return (
    <div
      className="iris-dock fixed inset-x-0 z-40 px-2 pointer-events-none"
      style={{ bottom: "calc(52px + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Iris voice"
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-2 rounded-xl border border-cyan-400/30 bg-black/92 px-2 py-1.5 shadow-[0_0_24px_rgb(6_182_212/0.12)] backdrop-blur-xl">
        <div className="h-[4.25rem] w-[4.25rem] shrink-0 [&>div]:!max-w-none [&>div]:h-full [&>div]:w-full">
          {core}
        </div>
        <div className="min-w-0 flex-1 py-0.5 text-left [&_p]:text-left [&_div]:text-left">
          <ConversationCaptions convo={convo} googleConnected={googleConnected} />
        </div>
      </div>
    </div>
  );
}
