import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Mic, MicOff, Send, X } from "lucide-react";
import { authHeaders, ensureSession } from "../lib/google";
import { useSpeechInput } from "../hooks/useSpeechInput";
import { useVoiceOutput } from "../hooks/useVoiceOutput";
import { addDays } from "../../shared/timezone";

type Turn = { role: "user" | "assistant"; content: string };

interface Props {
  /** Builds the "right now" notes at send time (fresh each turn). */
  buildContext: () => string;
  onAddTodo: (title: string, dueDate?: string) => void;
  timeZone: string;
  today: string;
  googleConnected: boolean;
}

const GOODBYE = /^(stop|that'?s all|that is all|i'?m good|thanks,? alfred|thank you,? alfred|goodbye|bye( alfred)?|never ?mind)[.!]?$/i;

async function askAlfred(messages: Turn[], context: string, timeZone: string): Promise<{ reply: string; todos: { title: string; due: string }[] }> {
  await ensureSession();
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context, timeZone }),
  });
  const data = (await res.json().catch(() => ({}))) as { reply?: string; todos?: { title: string; due: string }[]; error?: string };
  if (!res.ok || !data.reply) throw new Error(data.error ?? "Alfred couldn't answer. Try again.");
  return { reply: data.reply, todos: data.todos ?? [] };
}

/** "Talk to Alfred": a back-and-forth voice conversation (Claude), hands-free. */
export function ConversationPanel({ buildContext, onAddTodo, timeZone, today, googleConnected }: Props) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handsFree, setHandsFree] = useState(true);
  const [draft, setDraft] = useState("");
  const voice = useVoiceOutput();
  const openRef = useRef(open);
  openRef.current = open;
  const handsFreeRef = useRef(handsFree);
  handsFreeRef.current = handsFree;
  const turnsRef = useRef(turns);
  turnsRef.current = turns;
  const listRef = useRef<HTMLDivElement>(null);
  // The mic hook is created below; this ref lets send() restart listening.
  const listenRef = useRef<() => void>(() => undefined);

  const send = useCallback(
    async (text: string) => {
      const said = text.trim();
      if (!said) return;
      if (GOODBYE.test(said)) {
        setTurns((t) => [...t, { role: "user", content: said }, { role: "assistant", content: "Anytime, E." }]);
        voice.speak("Anytime, E.", { force: true });
        setOpen(false);
        return;
      }
      const next = [...turnsRef.current, { role: "user" as const, content: said }];
      setTurns(next);
      setBusy(true);
      setError(null);
      try {
        const { reply, todos } = await askAlfred(next, buildContext(), timeZone);
        for (const t of todos) {
          onAddTodo(t.title, t.due === "today" ? today : t.due === "tomorrow" ? addDays(today, 1) : undefined);
        }
        setTurns((t) => [...t, { role: "assistant", content: reply }]);
        voice.speak(reply, {
          force: true,
          // Hands-free: listen again once Alfred finishes talking.
          onEnd: () => {
            if (openRef.current && handsFreeRef.current) listenRef.current();
          },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Alfred couldn't answer.");
      } finally {
        setBusy(false);
      }
    },
    [buildContext, onAddTodo, timeZone, today, voice],
  );

  const speech = useSpeechInput((text) => void send(text));
  listenRef.current = () => {
    if (speech.supported) speech.start();
  };

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  const start = () => {
    voice.prime(); // iPhone: unlock speech inside the tap
    setOpen(true);
    setError(null);
    if (speech.supported) speech.start();
  };
  const close = () => {
    speech.stop();
    voice.stop();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="btn-ghost inline-flex items-center gap-2 border border-alfred-gold/40 px-4 py-2 text-xs font-mono uppercase tracking-wider text-alfred-gold"
        onClick={start}
        aria-label="Talk to Alfred"
      >
        <MessageCircle className="h-4 w-4" aria-hidden /> Talk to Alfred
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/70 p-3" role="dialog" aria-modal aria-label="Conversation with Alfred">
          <div className="panel-hud flex w-full max-w-lg flex-col p-4" style={{ maxHeight: "85vh" }}>
            <div className="mb-2 flex items-center justify-between">
              <p className="hud-label flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden /> Talking with Alfred
              </p>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-[11px] text-alfred-mist">
                  <input type="checkbox" checked={handsFree} onChange={(e) => setHandsFree(e.target.checked)} />
                  Hands-free
                </label>
                <button type="button" className="btn-ghost p-1.5" onClick={close} aria-label="End conversation">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!googleConnected && (
              <p className="mb-2 text-xs text-amber-200">Connect Google in Settings first. It keeps Alfred's brain private to you.</p>
            )}

            <div ref={listRef} className="min-h-[120px] flex-1 space-y-2 overflow-y-auto py-1">
              {!turns.length && !speech.listening && <p className="text-sm text-alfred-mist">Ask me anything about your day, or tell me something to add to your list.</p>}
              {turns.map((t, i) => (
                <p
                  key={i}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${t.role === "user" ? "ml-auto bg-alfred-gold/15 text-alfred-cream" : "border border-alfred-border/60"}`}
                >
                  {t.content}
                </p>
              ))}
              {speech.listening && (
                <p className="ml-auto max-w-[85%] rounded-lg bg-alfred-gold/10 px-3 py-2 text-sm italic text-alfred-mist">{speech.interim || "Listening…"}</p>
              )}
              {busy && (
                <p className="flex items-center gap-2 text-xs text-alfred-mist">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Alfred is thinking…
                </p>
              )}
            </div>

            {(error || speech.error) && <p className="mt-2 text-xs text-amber-300/90">{error ?? speech.error}</p>}

            <div className="mt-3 flex items-center gap-2">
              {speech.supported && (
                <button
                  type="button"
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${speech.listening ? "animate-pulse border-alfred-gold bg-alfred-gold/20 text-alfred-gold" : "border-alfred-border/60 text-alfred-mist"}`}
                  onClick={() => {
                    voice.prime();
                    if (speech.listening) speech.stop();
                    else {
                      voice.stop();
                      speech.start();
                    }
                  }}
                  aria-label={speech.listening ? "Stop listening" : "Speak"}
                >
                  {speech.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
              )}
              <form
                className="flex flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  voice.prime();
                  void send(draft);
                  setDraft("");
                }}
              >
                <input className="input-field flex-1" placeholder="Or type…" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Message Alfred" />
                <button type="submit" className="btn-gold px-3" disabled={busy || !draft.trim()} aria-label="Send">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
            <p className="mt-2 text-[10px] text-alfred-mist">Say “that's all” to end. Family Purpose student details are never sent.</p>
          </div>
        </div>
      )}
    </>
  );
}
