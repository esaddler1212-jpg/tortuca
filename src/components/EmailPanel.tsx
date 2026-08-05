import { Mail, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { EmailMessage } from "../types";

interface Props {
  messages: EmailMessage[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  onConnect: () => void;
  onRefresh: () => void;
}

export function EmailPanel({
  messages,
  loading,
  error,
  connected,
  onConnect,
  onRefresh,
}: Props) {
  return (
    <section className="panel p-5">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-alfred-gold">
          <Mail className="h-5 w-5" aria-hidden />
          <h2 className="font-display text-xl font-semibold tracking-wide">Inbox</h2>
        </div>
        {connected && (
          <button type="button" className="btn-ghost" onClick={onRefresh} aria-label="Refresh email">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </header>
      {!connected && (
        <div className="text-sm text-alfred-mist space-y-3">
          <p>Connect Gmail so Alfred can summarize your latest messages.</p>
          <button type="button" className="btn-gold" onClick={onConnect}>
            Connect Google
          </button>
        </div>
      )}
      {connected && error && <p className="text-sm text-red-300/90">{error}</p>}
      {connected && !error && (
        <ul className="space-y-3 max-h-80 overflow-y-auto">
          {messages.length === 0 && !loading && (
            <li className="text-sm text-alfred-mist">No recent messages.</li>
          )}
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-lg border px-3 py-2 ${
                m.unread
                  ? "border-alfred-gold/40 bg-alfred-gold/5"
                  : "border-alfred-border/60 bg-alfred-ink/30"
              }`}
            >
              <div className="flex justify-between gap-2 text-xs text-alfred-mist mb-1">
                <span className="truncate">{m.from}</span>
                <time dateTime={m.date}>
                  {format(parseISO(m.date), "MMM d, h:mm a")}
                </time>
              </div>
              <p className={`text-sm ${m.unread ? "font-medium" : ""}`}>{m.subject}</p>
              <p className="text-xs text-alfred-mist mt-1 line-clamp-2">{m.snippet}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
