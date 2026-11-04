import { useEffect, useMemo, useState } from "react";
import { ExternalLink, ListPlus, Mail, RefreshCw } from "lucide-react";
import type { EmailMessage } from "../types";
import { HudFrame } from "./hud/HudFrame";

interface Props {
  messages: EmailMessage[];
  unread: number;
  loading: boolean;
  error: string | null;
  googleConnected: boolean;
  timeZone: string;
  onRefresh: () => void;
  onConnectGoogle: () => void;
  onAddTodo: (title: string) => void;
}

const REFRESH_MS = 5 * 60_000;

/** "Jane Doe <jane@x.com>" → "Jane Doe"; a bare address stays as is. */
function senderName(from: string): string {
  const name = from.replace(/<[^>]*>/, "").trim().replace(/^"(.*)"$/, "$1").trim();
  return name || from.replace(/[<>]/g, "").trim();
}

function when(iso: string, timeZone: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = (x: Date) => x.toLocaleDateString("en-US", { timeZone });
  const now = new Date();
  if (day(d) === day(now)) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone });
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (day(d) === day(yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone });
}

/** Inbox module: newest mail, unread first filter, open in Gmail, turn into a to-do. */
export function InboxPanel({ messages, unread, loading, error, googleConnected, timeZone, onRefresh, onConnectGoogle, onAddTodo }: Props) {
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());

  // Fresh mail while the module is open, and when you come back to the app.
  useEffect(() => {
    if (!googleConnected) return;
    onRefresh();
    const t = setInterval(() => document.visibilityState === "visible" && onRefresh(), REFRESH_MS);
    const onVis = () => document.visibilityState === "visible" && onRefresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleConnected]);

  const shown = useMemo(() => (onlyUnread ? messages.filter((m) => m.unread) : messages), [messages, onlyUnread]);
  const chip = "min-h-[36px] rounded-full border px-3.5 font-mono text-[11px] uppercase tracking-wider";

  return (
    <HudFrame title="Inbox" tag={googleConnected ? `${unread} unread` : "Gmail"}>
      {!googleConnected ? (
        <div className="space-y-3">
          <p className="text-sm text-alfred-mist">Connect Gmail to see your newest mail here.</p>
          <button type="button" className="btn-gold w-full min-h-[44px] text-sm" onClick={onConnectGoogle}>
            Connect Gmail
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2" role="group" aria-label="Which mail">
            {(
              [
                [false, `All ${messages.length}`],
                [true, `Unread ${unread}`],
              ] as const
            ).map(([v, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={onlyUnread === v}
                onClick={() => setOnlyUnread(v)}
                className={`${chip} ${onlyUnread === v ? "border-alfred-gold bg-alfred-gold/15 text-alfred-gold" : "border-alfred-border/60 text-alfred-mist"}`}
              >
                {label}
              </button>
            ))}
            <button type="button" className="btn-ghost ml-auto flex h-11 w-11 items-center justify-center" onClick={onRefresh} disabled={loading} aria-label="Refresh inbox">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {error && <p className="text-xs text-amber-300/90">{error}</p>}
          {!shown.length && !loading && (
            <p className="flex items-center gap-2 py-4 text-sm text-alfred-mist">
              <Mail className="h-4 w-4" aria-hidden /> {onlyUnread ? "No unread mail." : "Inbox clear."}
            </p>
          )}
          <ul className="space-y-2">
            {shown.map((m) => (
              <li key={m.id} className={`rounded-lg border ${m.unread ? "border-alfred-gold/40 bg-alfred-gold/5" : "border-alfred-border/50"}`}>
                <div className="flex items-stretch">
                  <a
                    href={`https://mail.google.com/mail/u/0/#all/${encodeURIComponent(m.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 px-3 py-2.5"
                    aria-label={`${m.unread ? "Unread: " : ""}${m.subject} from ${senderName(m.from)}. Open in Gmail`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate text-sm ${m.unread ? "font-semibold text-alfred-cream" : "text-alfred-cream/85"}`}>{senderName(m.from)}</p>
                      <span className="shrink-0 font-mono text-[11px] text-alfred-mist">{when(m.date, timeZone)}</span>
                    </div>
                    <p className={`truncate text-sm ${m.unread ? "text-alfred-cream" : "text-alfred-cream/75"}`}>{m.subject || "(no subject)"}</p>
                    {m.snippet && <p className="line-clamp-2 text-xs text-alfred-mist">{m.snippet}</p>}
                  </a>
                  <div className="flex flex-col border-l border-alfred-border/40">
                    <button
                      type="button"
                      className="flex h-11 w-11 flex-1 items-center justify-center text-alfred-gold disabled:text-emerald-300"
                      onClick={() => {
                        onAddTodo(`Reply: ${m.subject || senderName(m.from)}`);
                        setAdded((s) => new Set(s).add(m.id));
                      }}
                      disabled={added.has(m.id)}
                      aria-label={added.has(m.id) ? "Added to your list" : `Add a reply to ${senderName(m.from)} to your list`}
                    >
                      {added.has(m.id) ? <span className="font-mono text-[10px]">ADDED</span> : <ListPlus className="h-4 w-4" />}
                    </button>
                    <a
                      href={`https://mail.google.com/mail/u/0/#all/${encodeURIComponent(m.id)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-11 w-11 flex-1 items-center justify-center border-t border-alfred-border/40 text-alfred-mist"
                      aria-label="Open in Gmail"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-alfred-mist">Newest 12 from Gmail · refreshes every 5 minutes while open. Write replies by brand in Drafts.</p>
        </div>
      )}
    </HudFrame>
  );
}
