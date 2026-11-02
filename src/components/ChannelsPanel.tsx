import { useState } from "react";
import { Mail, Send, Trash2 } from "lucide-react";
import type { ChannelConfig, ChannelDraft, ChannelId, ChannelsState } from "../../shared/channels";
import { getChannel } from "../../shared/channels";

interface Props {
  state: ChannelsState;
  pending: ChannelDraft[];
  googleConnected: boolean;
  accountEmail?: string;
  onSaveChannel: (id: ChannelId, patch: Partial<Pick<ChannelConfig, "fromEmail" | "replyTo" | "enabled" | "notes">>) => void;
  onAddDraft: (draft: { channelId: ChannelId; to: string; subject: string; body: string }) => void;
  onDiscardDraft: (id: string) => void;
  onSendDraft: (id: string) => Promise<string | null>;
  onConnectGoogle: () => void;
}

export function ChannelsPanel({
  state,
  pending,
  googleConnected,
  accountEmail,
  onSaveChannel,
  onAddDraft,
  onDiscardDraft,
  onSendDraft,
  onConnectGoogle,
}: Props) {
  const [expanded, setExpanded] = useState<ChannelId | null>(null);
  const [draftChannel, setDraftChannel] = useState<ChannelId>("tortuga");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const queueDraft = () => {
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    onAddDraft({ channelId: draftChannel, to: to.trim(), subject: subject.trim(), body: body.trim() });
    setTo("");
    setSubject("");
    setBody("");
  };

  const approveSend = async (id: string) => {
    setSendError(null);
    setSendingId(id);
    const err = await onSendDraft(id);
    setSendingId(null);
    if (err) setSendError(err);
  };

  return (
    <details className="panel-hud p-5 group channels-panel-dropdown">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3 text-left [&::-webkit-details-marker]:hidden">
        <span className="hud-label flex items-center gap-2">
          <Mail className="h-4 w-4" aria-hidden /> Channel agents
        </span>
        {pending.length ? (
          <span className="rounded-full border border-alfred-gold/50 bg-alfred-gold/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-alfred-gold">
            {pending.length} need OK
          </span>
        ) : (
          <span className="text-[10px] font-mono uppercase tracking-wider text-alfred-mist group-open:hidden">Expand</span>
        )}
      </summary>

      <div className="mt-4 space-y-5 border-t border-alfred-border/50 pt-4">
      <div>
        <p className="text-sm text-alfred-mist">
          One lane per business. Iris routes outbound mail; you approve before anything sends. Each From address must be
          set up as Send mail as on your Google account.
        </p>
        {!googleConnected ? (
          <button type="button" className="btn-gold mt-3 text-xs" onClick={onConnectGoogle}>
            Connect Google to send
          </button>
        ) : accountEmail ? (
          <p className="text-xs text-alfred-mist mt-2 font-mono">Primary account: {accountEmail}</p>
        ) : null}
      </div>

      <ul className="space-y-2">
        {state.channels.map((ch) => (
          <li key={ch.id} className="rounded-lg border border-alfred-border/60 bg-black/30 px-3 py-2">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 text-left text-sm"
              onClick={() => setExpanded(expanded === ch.id ? null : ch.id)}
            >
              <span className="text-alfred-cream">{ch.displayName}</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-alfred-mist">
                {ch.canSend ? ch.fromEmail || "set From" : "no send"}
              </span>
            </button>
            {expanded === ch.id ? (
              <div className="mt-3 space-y-2 border-t border-alfred-border/40 pt-3">
                {ch.isolated ? <p className="text-xs text-amber-200/90">{ch.notes ?? "Isolated channel."}</p> : null}
                {ch.canSend ? (
                  <>
                    <label className="text-xs text-alfred-mist">From email</label>
                    <input
                      className="input-field text-xs"
                      value={ch.fromEmail}
                      onChange={(e) => onSaveChannel(ch.id, { fromEmail: e.target.value })}
                      placeholder="sponsors@yourdomain.com"
                    />
                    <label className="text-xs text-alfred-mist">Reply-To (optional)</label>
                    <input
                      className="input-field text-xs"
                      value={ch.replyTo ?? ""}
                      onChange={(e) => onSaveChannel(ch.id, { replyTo: e.target.value })}
                    />
                  </>
                ) : null}
                <p className="text-[10px] text-alfred-mist">
                  {ch.googleLinked ? "Own Google linked." : "Separate inbox connect — coming soon."}
                </p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="border-t border-alfred-border/50 pt-4 space-y-3">
        <p className="text-xs font-mono uppercase tracking-wider text-alfred-gold">Queue a draft</p>
        <select className="input-field text-sm" value={draftChannel} onChange={(e) => setDraftChannel(e.target.value as ChannelId)}>
          {state.channels
            .filter((c) => c.canSend && c.enabled)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
        </select>
        <input className="input-field text-sm" placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} />
        <input className="input-field text-sm" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea className="input-field min-h-[72px] text-sm" placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
        <button type="button" className="btn-gold w-full text-sm" disabled={!googleConnected} onClick={queueDraft}>
          Add to approval queue
        </button>
      </div>

      {pending.length ? (
        <div className="border-t border-alfred-border/50 pt-4 space-y-3">
          <p className="text-xs font-mono uppercase tracking-wider text-alfred-gold">Needs your OK ({pending.length})</p>
          {sendError ? (
            <p className="text-sm text-red-400" role="alert">
              {sendError}
            </p>
          ) : null}
          {pending.map((d) => {
            const ch = getChannel(state, d.channelId);
            return (
              <div key={d.id} className="rounded-md border border-alfred-gold/30 bg-green-950/10 p-3 text-sm space-y-2">
                <p className="text-alfred-gold text-xs font-mono uppercase">{ch?.displayName ?? d.channelId}</p>
                <p>
                  <span className="text-alfred-mist">To:</span> {d.to}
                </p>
                <p>
                  <span className="text-alfred-mist">Subject:</span> {d.subject}
                </p>
                <pre className="whitespace-pre-wrap text-xs text-alfred-cream/90 max-h-32 overflow-y-auto">{d.body}</pre>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-gold text-xs inline-flex items-center gap-1"
                    disabled={!googleConnected || sendingId === d.id}
                    onClick={() => void approveSend(d.id)}
                  >
                    {sendingId === d.id ? (
                      "Sending…"
                    ) : (
                      <>
                        <Send className="h-3 w-3" aria-hidden /> Send
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-xs inline-flex items-center gap-1 border border-alfred-border"
                    onClick={() => onDiscardDraft(d.id)}
                  >
                    <Trash2 className="h-3 w-3" aria-hidden /> Discard
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-alfred-mist">No drafts waiting.</p>
      )}
      </div>
    </details>
  );
}
