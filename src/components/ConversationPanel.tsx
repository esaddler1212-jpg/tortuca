import { Check, X } from "lucide-react";
import type { Conversation } from "../hooks/useConversation";

/**
 * Under the Iris ring: no captions, just a short hint, setup errors, the
 * "save this conversation?" choice, and End. The ring itself is the button.
 */
export function ConversationCaptions({ convo, googleConnected }: { convo: Conversation; googleConnected: boolean }) {
  const chip = "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-mono uppercase tracking-wider";
  if (!convo.active) {
    return (
      <p className="text-center text-[11px] font-mono uppercase tracking-[0.2em] text-alfred-mist" aria-hidden>
        Tap Iris to talk
      </p>
    );
  }
  return (
    <div className="w-full max-w-md space-y-2 text-center" aria-live="polite">
      {!googleConnected && <p className="text-xs text-amber-200">Connect Google in Settings first. It keeps Iris's brain private to you.</p>}
      {convo.error && <p className="text-xs text-amber-300/90">{convo.error}</p>}
      {convo.offerSave ? (
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-alfred-mist">Save this conversation to Memos?</span>
          <button type="button" className={`${chip} border-alfred-gold bg-alfred-gold/15 text-alfred-gold`} onClick={convo.saveTranscript}>
            <Check className="h-3 w-3" aria-hidden /> Save
          </button>
          <button type="button" className={`${chip} border-alfred-border/60 text-alfred-mist`} onClick={convo.skipSave}>
            No
          </button>
        </div>
      ) : (
        <button type="button" className={`${chip} border-alfred-border/60 text-alfred-mist hover:text-alfred-gold`} onClick={convo.end} aria-label="End conversation">
          <X className="h-3 w-3" aria-hidden /> End
        </button>
      )}
    </div>
  );
}
