import { useCallback, useEffect, useRef, useState } from "react";
import { isNoiseTranscript } from "../../shared/speechText";

/** Minimal typing for the browser Web Speech API (Safari/Chrome prefix it). */
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed":
    "Microphone access is blocked. iPhone: Settings → Safari → Microphone → Allow (and Settings → Privacy → Speech Recognition). Computer: allow the mic in the address bar.",
  "service-not-allowed":
    "Speech recognition is turned off. iPhone: Settings → General → Keyboard → Enable Dictation, and Settings → Siri.",
  "no-speech": "Didn't catch that. Tap and try again.",
  "audio-capture": "No microphone found.",
  network: "Speech recognition needs an internet connection.",
};

/** After the last heard words, wait this long before ending the turn (TEN-style endpointing). */
export const SPEECH_TURN_END_MS = 850;

/**
 * Speech-to-text via the browser (Apple's recognizer in Safari/iPhone, Google's
 * in Chrome). Accumulates finals and ends the turn after a short silence window.
 */
export function useSpeechInput(onFinal: (text: string) => void) {
  const [supported] = useState(() => typeof window !== "undefined" && getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** Raw error code ("no-speech", "not-allowed"…) so callers can treat silence gently. */
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  const committedRef = useRef("");
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearEndTimer = useCallback(() => {
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearEndTimer();
      recRef.current?.abort();
    },
    [clearEndTimer],
  );

  const stop = useCallback(() => {
    clearEndTimer();
    recRef.current?.stop();
  }, [clearEndTimer]);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError(
        "Voice input isn't available in this browser. On iPhone, tap the text box and use the keyboard's 🎤 dictation key.",
      );
      return;
    }
    clearEndTimer();
    recRef.current?.abort();
    committedRef.current = "";
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = true;

    const scheduleTurnEnd = () => {
      clearEndTimer();
      endTimerRef.current = setTimeout(() => {
        endTimerRef.current = null;
        try {
          rec.stop();
        } catch {
          /* already stopped */
        }
      }, SPEECH_TURN_END_MS);
    };

    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const chunk = r[0].transcript;
        if (r.isFinal) committedRef.current += chunk;
        else live += chunk;
      }
      const display = (committedRef.current + live).trim();
      setInterim(display);
      if (display) scheduleTurnEnd();
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      clearEndTimer();
      setErrorCode(e.error);
      setError(ERROR_MESSAGES[e.error] ?? `Voice input error: ${e.error}`);
    };
    rec.onend = () => {
      clearEndTimer();
      setListening(false);
      setInterim("");
      const text = committedRef.current.trim();
      committedRef.current = "";
      if (text && !isNoiseTranscript(text)) onFinalRef.current(text);
    };
    recRef.current = rec;
    setError(null);
    setErrorCode(null);
    setInterim("");
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Couldn't start the microphone. Try again.");
    }
  }, [clearEndTimer]);

  return { supported, listening, interim, error, errorCode, start, stop };
}
