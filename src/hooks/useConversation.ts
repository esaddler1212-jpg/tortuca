import { useCallback, useRef, useState } from "react";
import { authHeaders, ensureSession } from "../lib/google";
import { useSpeechInput } from "./useSpeechInput";
import { useVoiceOutput, useVoiceSignal } from "./useVoiceOutput";
import { addDays } from "../../shared/timezone";

export type Turn = { role: "user" | "assistant"; content: string };
/** What the Iris ring shows. */
export type ConversationPhase = "idle" | "listening" | "thinking" | "speaking";

const YES = /^(yes|yeah|yep|yup|sure|please|save( it)?|do it|ok(ay)?|go ahead)\b/i;
const GOODBYE = /^(stop|that'?s all|that is all|i'?m good|thanks,? alfred|thank you,? alfred|goodbye|bye( alfred)?|never ?mind)[.!]?$/i;

async function askAlfred(messages: Turn[], context: string, timeZone: string): Promise<{ reply: string; todos: { title: string; due: string }[] }> {
  await ensureSession();
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context, timeZone }),
  });
  const data = (await res.json().catch(() => ({}))) as { reply?: string; todos?: { title: string; due: string }[]; error?: string };
  if (!res.ok || !data.reply) throw new Error(data.error ?? "Iris couldn't answer. Try again.");
  return { reply: data.reply, todos: data.todos ?? [] };
}

/**
 * A back-and-forth voice conversation with Iris (Claude). Shared by the core
 * ring (tap to talk, reacts to each phase) and the captions under it.
 */
export function useConversation(opts: {
  buildContext: () => string;
  onAddTodo: (title: string, dueDate?: string) => void;
  timeZone: string;
  today: string;
  /** Save the finished conversation (e.g. to Memos). */
  onSaveTranscript?: (text: string) => void;
}) {
  const [active, setActive] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handsFree, setHandsFree] = useState(true);
  /** Iris asked "save this conversation?" and is waiting for yes/no. */
  const [offerSave, setOfferSave] = useState(false);
  const offerSaveRef = useRef(offerSave);
  offerSaveRef.current = offerSave;
  /** Bumps when a reply arrives (the ring bursts). */
  const [replyTick, setReplyTick] = useState(0);
  const voice = useVoiceOutput();
  const signal = useVoiceSignal();

  const optsRef = useRef(opts);
  optsRef.current = opts;
  const activeRef = useRef(active);
  activeRef.current = active;
  const handsFreeRef = useRef(handsFree);
  handsFreeRef.current = handsFree;
  const turnsRef = useRef(turns);
  turnsRef.current = turns;
  const listenRef = useRef<() => void>(() => undefined);

  const transcript = () =>
    turnsRef.current.map((t) => `${t.role === "user" ? "You" : "Iris"}: ${t.content}`).join("\n");

  /** Close out: save (or not), say goodbye, end. */
  const finish = useCallback(
    (save: boolean) => {
      if (save && turnsRef.current.length) optsRef.current.onSaveTranscript?.(transcript());
      setOfferSave(false);
      setActive(false);
      setTurns([]);
      voice.speak(save ? "Saved to your memos. Anytime, boss." : "Anytime, boss.", { force: true });
    },
    [voice],
  );

  /** Ending: if we actually talked, Iris offers to save the transcript. */
  const wrapUp = useCallback(() => {
    if (!turnsRef.current.some((t) => t.role === "assistant") || !optsRef.current.onSaveTranscript) {
      finish(false);
      return;
    }
    setOfferSave(true);
    voice.speak("Want me to save this conversation to your memos?", {
      force: true,
      onEnd: () => {
        if (activeRef.current && offerSaveRef.current) listenRef.current();
      },
    });
  }, [finish, voice]);

  const send = useCallback(
    async (text: string) => {
      const said = text.trim();
      if (!said) return;
      if (offerSaveRef.current) {
        finish(YES.test(said));
        return;
      }
      if (GOODBYE.test(said)) {
        wrapUp();
        return;
      }
      const next = [...turnsRef.current, { role: "user" as const, content: said }];
      setTurns(next);
      setBusy(true);
      setError(null);
      try {
        const { buildContext, timeZone, today, onAddTodo } = optsRef.current;
        const { reply, todos } = await askAlfred(next, buildContext(), timeZone);
        for (const t of todos) onAddTodo(t.title, t.due === "today" ? today : t.due === "tomorrow" ? addDays(today, 1) : undefined);
        setTurns((t) => [...t, { role: "assistant", content: reply }]);
        setReplyTick((n) => n + 1);
        voice.speak(reply, {
          force: true,
          // Hands-free: listen again once Iris finishes talking.
          onEnd: () => {
            if (activeRef.current && handsFreeRef.current) listenRef.current();
          },
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Iris couldn't answer.");
      } finally {
        setBusy(false);
      }
    },
    [voice, finish, wrapUp],
  );

  const speech = useSpeechInput((text) => void send(text));
  listenRef.current = () => {
    if (speech.supported) speech.start();
  };

  /** Tap on the ring: start, or interrupt Iris and listen, or stop listening. */
  const tap = useCallback(() => {
    voice.prime(); // iPhone: unlock speech inside the tap
    setError(null);
    if (!activeRef.current) {
      setActive(true);
      if (speech.supported) speech.start();
      return;
    }
    if (speech.listening) {
      speech.stop();
      return;
    }
    voice.stop();
    if (speech.supported) speech.start();
  }, [speech, voice]);

  /** End button: offer to save first (if there's anything to save). */
  const end = useCallback(() => {
    speech.stop();
    voice.stop();
    if (offerSaveRef.current) finish(false);
    else wrapUp();
  }, [speech, voice, finish, wrapUp]);

  const phase: ConversationPhase = signal.speaking
    ? "speaking"
    : busy
      ? "thinking"
      : speech.listening
        ? "listening"
        : "idle";

  return {
    active,
    phase,
    turns,
    error: error ?? speech.error,
    interim: speech.interim,
    micSupported: speech.supported,
    handsFree,
    setHandsFree,
    replyTick,
    offerSave,
    saveTranscript: () => finish(true),
    skipSave: () => finish(false),
    tap,
    end,
    send: (text: string) => {
      voice.prime();
      void send(text);
    },
  };
}

export type Conversation = ReturnType<typeof useConversation>;
