import { useCallback, useEffect, useState } from "react";

const MUTE_KEY = "alfred-voice-muted";
const listeners = new Set<(muted: boolean) => void>();

/** Alfred's voice activity, shared app-wide so the core ring can "talk". */
export interface VoiceSignal {
  speaking: boolean;
  /** Bumps on every spoken word (when the browser reports word boundaries). */
  tick: number;
}
let voiceSignal: VoiceSignal = { speaking: false, tick: 0 };
const signalListeners = new Set<(s: VoiceSignal) => void>();
function emitSignal(next: Partial<VoiceSignal>) {
  voiceSignal = { ...voiceSignal, ...next };
  signalListeners.forEach((l) => l(voiceSignal));
}

/** Subscribe to Alfred speaking (any part of the app). */
export function useVoiceSignal(): VoiceSignal {
  const [s, setS] = useState(voiceSignal);
  useEffect(() => {
    signalListeners.add(setS);
    return () => {
      signalListeners.delete(setS);
    };
  }, []);
  return s;
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function speechOutputSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/** Alfred's voice: British "Daniel" (iPhone/Mac), else any en-GB, else English. */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /daniel/i.test(v.name) && v.lang.startsWith("en")) ??
    voices.find((v) => v.lang === "en-GB" && /male|arthur|oliver|george/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-GB") ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

/**
 * Text-to-speech for Alfred's replies (browser speech synthesis: Apple voices
 * on iPhone/Mac, system voices elsewhere). Mute state is shared app-wide and
 * remembered on the device. iPhone only allows speech after a tap, so call
 * `prime()` inside a tap before speaking from async code.
 */
export function useVoiceOutput() {
  const supported = speechOutputSupported();
  const [muted, setMutedState] = useState(readMuted);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const onChange = (m: boolean) => setMutedState(m);
    listeners.add(onChange);
    if (supported) window.speechSynthesis.getVoices(); // start loading voices early
    return () => {
      listeners.delete(onChange);
    };
  }, [supported]);

  const setMuted = useCallback((m: boolean) => {
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
    if (m && speechOutputSupported()) window.speechSynthesis.cancel();
    listeners.forEach((l) => l(m));
  }, []);

  /** Unlock speech on iPhone: call synchronously inside a tap. */
  const prime = useCallback(() => {
    if (!speechOutputSupported() || readMuted()) return;
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }, []);

  const speak = useCallback((text: string, opts: { force?: boolean; onEnd?: () => void } = {}) => {
    if (!speechOutputSupported() || !text.trim() || (readMuted() && !opts.force)) {
      opts.onEnd?.();
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    u.rate = 1.02;
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      setSpeaking(false);
      emitSignal({ speaking: false });
      opts.onEnd?.();
    };
    u.onstart = () => {
      setSpeaking(true);
      emitSignal({ speaking: true });
    };
    u.onboundary = (e) => {
      if (e.name === "word" || !e.name) emitSignal({ tick: voiceSignal.tick + 1 });
    };
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
  }, []);

  const stop = useCallback(() => {
    if (speechOutputSupported()) window.speechSynthesis.cancel();
    setSpeaking(false);
    emitSignal({ speaking: false });
  }, []);

  return { supported, muted, setMuted, speak, prime, stop, speaking };
}
