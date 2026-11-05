import { useCallback, useEffect, useRef, useState } from "react";
import { authHeaders, ensureSession } from "../lib/google";
import { useSpeechInput } from "./useSpeechInput";
import { useVoiceOutput, useVoiceSignal } from "./useVoiceOutput";
import { addDays } from "../../shared/timezone";
import { isHudModuleId, matchModuleFromSpeech, type HudModuleId } from "../../shared/hudModules";

export type Turn = { role: "user" | "assistant"; content: string; /** Read-out of the brief, not a real exchange. */ brief?: boolean };
/** What the Iris ring shows. */
export type ConversationPhase = "idle" | "listening" | "thinking" | "speaking";

/** Answers to "go over the brief, or something else?" */
const WANTS_BRIEF = /\b(brief|briefing|rundown|run ?down|run it|go over|yes|yeah|yep|yup|sure|let'?s do it|let'?s go|go ahead|please)\b/i;
const NOTHING = /^(no|nope|nah|i'?m good|i'?m straight|nothing|not now|later|all good|never ?mind)\b/i;
const GREET_KEY = "iris-greet"; // "0" = don't greet on open
const AWAY_MS = 30 * 60_000; // greet again after 30+ minutes away

export function greetingEnabled(): boolean {
  try {
    return localStorage.getItem(GREET_KEY) !== "0";
  } catch {
    return true;
  }
}
export function setGreetingEnabled(on: boolean) {
  try {
    localStorage.setItem(GREET_KEY, on ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}

const YES = /^(yes|yeah|yep|yup|sure|please|save( it)?|do it|ok(ay)?|go ahead)\b/i;
const NO = /^(no|nope|nah|don'?t|skip|not this time)\b/i;
/** "Thanks, Iris", "that's all", "bye boss", "okay I'm good"… ends the conversation. */
export const GOODBYE =
  /^(?:(?:ok(?:ay)?|alright|cool|perfect|great)[,.!]?\s*)?(?:stop|that'?s (?:all|it)|that is all|i(?:'?m| am) (?:good|done|straight)|we'?re (?:good|done)|thanks?(?: you)?(?: so much)?|thank you|goodbye|bye(?: bye)?|good ?night|later|peace|never ?mind)(?:[,.!]?\s*(?:iris|boss|girl))?(?:[,.!]?\s*(?:that'?s all|for now|bye))?[.!]*$/i;

/** What Iris says while a slower answer (web search, flight lookup) is on its way. */
const FILLERS = ["One sec.", "Let me check.", "On it.", "Give me a second, boss.", "Checking now."];
const FILLER_AFTER_MS = 2500;
const ASK_TIMEOUT_MS = 35_000;
/** Pick the conversation back up if E taps her again within this window. */
const RESUME_MS = 10 * 60_000;
/** Small pause before listening again, so the mic doesn't catch the end of her voice. */
const RELISTEN_DELAY_MS = 250;

async function askAlfred(
  messages: Turn[],
  context: string,
  timeZone: string,
  extra: { signal?: AbortSignal; location?: { lat: number; lon: number } } = {},
): Promise<{ reply: string; todos: { title: string; due: string }[]; module?: HudModuleId }> {
  await ensureSession();
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    // Brief read-outs are local; the model only needs the real exchange.
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
      context,
      timeZone,
      ...(extra.location ? { lat: extra.location.lat, lon: extra.location.lon } : {}),
    }),
    signal: extra.signal,
  });
  const data = (await res.json().catch(() => ({}))) as {
    reply?: string;
    todos?: { title: string; due: string }[];
    module?: string;
    error?: string;
  };
  if (!res.ok || !data.reply) throw new Error(data.error ?? "Iris couldn't answer. Try again.");
  const module = data.module && isHudModuleId(data.module) ? data.module : undefined;
  return { reply: data.reply, todos: data.todos ?? [], module };
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
  /** "Good morning, boss. Want to go over the brief…?" */
  buildGreeting?: () => string;
  /** The rundown Iris reads when E says "let's do the brief". */
  buildBrief?: () => string;
  /** Iris opened a HUD module (open_module tool or speech match). */
  onOpenModule?: (id: HudModuleId) => void;
  /** Where E is (for "how far is that flight from me"). */
  location?: { lat: number; lon: number };
}) {
  const [active, setActive] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const [error, setError] = useState<string | null>(null);
  const [handsFree, setHandsFree] = useState(true);
  /** Iris asked "save this conversation?" and is waiting for yes/no. */
  const [offerSave, setOfferSave] = useState(false);
  const offerSaveRef = useRef(offerSave);
  offerSaveRef.current = offerSave;
  /** Iris has a greeting ready but the browser needs a tap before she can speak. */
  const [pendingGreeting, setPendingGreeting] = useState(false);
  const pendingGreetingRef = useRef(pendingGreeting);
  pendingGreetingRef.current = pendingGreeting;
  /** She just asked "brief, or something else?" and is waiting for the answer. */
  const awaitingChoiceRef = useRef(false);
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
  /** Bumps per question; an older answer that arrives late is dropped. */
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  /** The last conversation, so a quick follow-up tap picks up where it left off. */
  const lastRef = useRef<{ turns: Turn[]; at: number } | null>(null);

  /** Listen again after she finishes (short pause so the mic doesn't hear her). */
  const relisten = () => {
    setTimeout(() => {
      if (activeRef.current) listenRef.current();
    }, RELISTEN_DELAY_MS);
  };

  /** Cancel a question still in flight (E tapped, ended, or asked again). */
  const cancelPending = () => {
    requestRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  };

  const transcript = () =>
    turnsRef.current.map((t) => `${t.role === "user" ? "You" : "Iris"}: ${t.content}`).join("\n");

  /** Close out: save (or not), say goodbye, end. */
  const finish = useCallback(
    (save: boolean) => {
      if (save && turnsRef.current.length) optsRef.current.onSaveTranscript?.(transcript());
      if (turnsRef.current.length) lastRef.current = { turns: turnsRef.current, at: Date.now() };
      setOfferSave(false);
      setActive(false);
      setTurns([]);
      voice.speak(save ? "Saved to your memos. Anytime, boss." : "Anytime, boss.", { force: true });
    },
    [voice],
  );

  /** Ending: if we actually talked, Iris offers to save the transcript. */
  const wrapUp = useCallback(() => {
    // Only offer to save when there was a real exchange (not just the brief).
    if (!turnsRef.current.some((t) => t.role === "assistant" && !t.brief) || !optsRef.current.onSaveTranscript) {
      finish(false);
      return;
    }
    setOfferSave(true);
    voice.speak("Want me to save this conversation to your memos?", {
      force: true,
      onEnd: () => {
        if (offerSaveRef.current) relisten();
      },
    });
  }, [finish, voice]);

  const send = useCallback(
    async (text: string) => {
      const said = text.trim();
      if (!said) return;
      if (offerSaveRef.current) {
        // A real question instead of yes/no: drop the offer and keep talking.
        const words = said.split(/\s+/).length;
        if (YES.test(said) || NO.test(said) || words <= 4) {
          finish(YES.test(said));
          return;
        }
        setOfferSave(false);
      }
      if (awaitingChoiceRef.current) {
        awaitingChoiceRef.current = false;
        const brief = optsRef.current.buildBrief?.();
        if (brief && WANTS_BRIEF.test(said)) {
          const text = `${brief} Anything else, boss?`;
          // Keep the brief in the conversation so follow-up questions have context.
          setTurns((t) => [...t, { role: "user", content: said, brief: true }, { role: "assistant", content: text, brief: true }]);
          setReplyTick((n) => n + 1);
          voice.speak(text, { force: true, onEnd: relisten });
          return;
        }
        if (NOTHING.test(said)) {
          setActive(false);
          setTurns([]);
          voice.speak("Alright. I'm here when you need me.", { force: true });
          return;
        }
        // Anything else: a normal conversation starting with what E said.
      }
      if (GOODBYE.test(said)) {
        wrapUp();
        return;
      }
      const next = [...turnsRef.current, { role: "user" as const, content: said }];
      setTurns(next);
      cancelPending();
      const id = requestRef.current;
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const timeout = setTimeout(() => ctrl.abort(), ASK_TIMEOUT_MS);
      // Slow answer (web search, flight lookup): say something so it doesn't feel dead.
      const filler = setTimeout(() => {
        if (requestRef.current === id && !window.speechSynthesis?.speaking) voice.speak(FILLERS[Math.floor(Math.random() * FILLERS.length)], { force: true });
      }, FILLER_AFTER_MS);
      setBusy(true);
      setError(null);
      try {
        const { buildContext, timeZone, today, onAddTodo, onOpenModule, location } = optsRef.current;
        const { reply, todos, module } = await askAlfred(next, buildContext(), timeZone, { signal: ctrl.signal, location });
        if (requestRef.current !== id) return; // E moved on
        for (const t of todos) onAddTodo(t.title, t.due === "today" ? today : t.due === "tomorrow" ? addDays(today, 1) : undefined);
        const open =
          module ??
          (/\b(open|show|bring( up)?|pull up|go to)\b/i.test(said) ? matchModuleFromSpeech(said) : null);
        if (open) onOpenModule?.(open);
        setTurns((t) => [...t, { role: "assistant", content: reply }]);
        setReplyTick((n) => n + 1);
        voice.speak(reply, {
          force: true,
          // Hands-free: listen again once Iris finishes talking.
          onEnd: () => {
            if (handsFreeRef.current) relisten();
          },
        });
      } catch (e) {
        if (requestRef.current !== id) return; // cancelled on purpose
        const timedOut = ctrl.signal.aborted;
        const offline = typeof navigator !== "undefined" && navigator.onLine === false;
        const message = timedOut
          ? "That took too long, boss. Tap me and ask again."
          : offline
            ? "Looks like you're offline, boss. I'll be here when you're back."
            : e instanceof TypeError
              ? "I lost the connection, boss. Tap me to try again."
              : e instanceof Error
                ? e.message
                : "I couldn't answer that one. Tap me to try again.";
        // Drop the unanswered question so asking again doesn't double it up.
        setTurns((t) => (t[t.length - 1]?.role === "user" ? t.slice(0, -1) : t));
        setError(message);
        voice.speak(message, { force: true });
      } finally {
        clearTimeout(timeout);
        clearTimeout(filler);
        if (requestRef.current === id) {
          abortRef.current = null;
          setBusy(false);
        }
      }
    },
    [voice, finish, wrapUp],
  );

  const speech = useSpeechInput((text) => void send(text));
  listenRef.current = () => {
    if (speech.supported) speech.start();
  };

  /** Iris greets E and asks: brief, or something else? Then listens. */
  const greet = useCallback(
    (fromTap: boolean) => {
      const text = optsRef.current.buildGreeting?.();
      if (!text) return;
      setPendingGreeting(false);
      setActive(true);
      setError(null);
      awaitingChoiceRef.current = true;
      let started = false;
      voice.speak(text, {
        force: true,
        onStart: () => {
          started = true;
        },
        onEnd: relisten,
      });
      if (!fromTap) {
        // Browsers (iPhone especially) block speech until the first tap.
        // If she couldn't start talking, wait for a tap on the ring instead.
        setTimeout(() => {
          if (!started) {
            voice.stop();
            awaitingChoiceRef.current = false;
            setActive(false);
            setPendingGreeting(true);
          }
        }, 1500);
      }
    },
    [voice],
  );

  // Greet on open, and again when coming back after 30+ minutes away.
  // (Runs once; greetRef keeps the latest greet without re-arming the timer.)
  const greetRef = useRef(greet);
  greetRef.current = greet;
  useEffect(() => {
    if (!optsRef.current.buildGreeting || !greetingEnabled()) return;
    const first = setTimeout(() => {
      if (!activeRef.current) greetRef.current(false);
    }, 1200);
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > AWAY_MS && !activeRef.current && greetingEnabled()) greetRef.current(false);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearTimeout(first);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  /** Tap on the ring: start, or interrupt Iris and listen, or stop listening. */
  const tap = useCallback(() => {
    voice.prime(); // iPhone: unlock speech inside the tap
    setError(null);
    if (!activeRef.current && pendingGreetingRef.current) {
      greet(true);
      return;
    }
    if (!activeRef.current) {
      // Tapped again soon after: pick the last conversation back up.
      const last = lastRef.current;
      if (last && Date.now() - last.at < RESUME_MS) setTurns(last.turns);
      lastRef.current = null;
      setActive(true);
      if (speech.supported) speech.start();
      return;
    }
    if (speech.listening) {
      speech.stop();
      return;
    }
    // Interrupt: stop talking (or drop a slow answer) and listen.
    if (busyRef.current) cancelPending();
    voice.stop();
    if (speech.supported) speech.start();
  }, [speech, voice, greet]);

  /** End button: offer to save first (if there's anything to save). */
  const end = useCallback(() => {
    speech.stop();
    voice.stop();
    cancelPending();
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
    // Silence mid-conversation isn't an error: the ring just shows "your turn".
    error: error ?? (active && speech.errorCode === "no-speech" ? null : speech.error),
    interim: speech.interim,
    micSupported: speech.supported,
    handsFree,
    setHandsFree,
    replyTick,
    offerSave,
    pendingGreeting,
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
