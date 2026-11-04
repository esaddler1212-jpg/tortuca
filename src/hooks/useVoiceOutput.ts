import { useCallback, useEffect, useState } from "react";

const MUTE_KEY = "alfred-voice-muted";
const listeners = new Set<(muted: boolean) => void>();

/** Iris's voice activity, shared app-wide so the core ring can "talk". */
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

/** Subscribe to Iris speaking (any part of the app). */
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

/** Known male system voices to skip when picking Iris's default voice. */
const MALE = /\b(alex|fred|daniel|tom|aaron|arthur|evan|nathan|oliver|george|gordon|reed|rocko|grandpa|eddy|ralph|junior|albert|david|mark|guy|ryan|christopher|eric|andrew|brian|roger|steffan|rishi|lee|thomas|jacques|ralf|hugh)\b/i;
const FEMALE = /\b(samantha|ava|allison|susan|zoe|nicky|joelle|serena|kate|stephanie|karen|moira|tessa|veena|fiona|catherine|martha|victoria|google us english|google uk english female|zira|aria|jenny|michelle|emma|libby|sonia|natasha|clara)\b/i;

const VOICE_KEY = "iris-voice"; // per device: each device has its own voices
const RATE_KEY = "iris-voice-rate";

export function getVoicePrefs(): { name: string | null; rate: number } {
  try {
    const rate = Number(localStorage.getItem(RATE_KEY));
    return { name: localStorage.getItem(VOICE_KEY), rate: rate >= 0.7 && rate <= 1.4 ? rate : 1 };
  } catch {
    return { name: null, rate: 1 };
  }
}

export function setVoicePrefs(prefs: { name?: string | null; rate?: number }) {
  try {
    if (prefs.name !== undefined) {
      if (prefs.name) localStorage.setItem(VOICE_KEY, prefs.name);
      else localStorage.removeItem(VOICE_KEY);
    }
    if (prefs.rate !== undefined) localStorage.setItem(RATE_KEY, String(prefs.rate));
  } catch {
    /* storage unavailable */
  }
}

/** "en-US" → "American", etc. */
export function accentLabel(lang: string): string {
  const l = lang.replace("_", "-").toLowerCase();
  const map: Record<string, string> = {
    "en-us": "American",
    "en-gb": "British",
    "en-au": "Australian",
    "en-ie": "Irish",
    "en-za": "South African",
    "en-in": "Indian",
    "en-nz": "New Zealand",
    "en-ca": "Canadian",
    "en-sc": "Scottish",
  };
  return map[l] ?? lang;
}

/** English voices on this device: female voices first, then by accent and name. */
export function listEnglishVoices(): SpeechSynthesisVoice[] {
  if (!speechOutputSupported()) return [];
  const seen = new Set<string>();
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("en") && !seen.has(v.name) && seen.add(v.name))
    .sort((a, b) => {
      const rank = (v: SpeechSynthesisVoice) => (FEMALE.test(v.name) ? 0 : MALE.test(v.name) ? 2 : 1);
      return rank(a) - rank(b) || accentLabel(a.lang).localeCompare(accentLabel(b.lang)) || a.name.localeCompare(b.name);
    });
}

/**
 * Iris's voice: the one chosen in Settings, else a US English female voice
 * ("Samantha" on iPhone/Mac, then other known US female voices), never a
 * known male voice unless that's all there is.
 */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const chosen = getVoicePrefs().name;
  const picked = chosen ? voices.find((v) => v.name === chosen) : undefined;
  if (picked) return picked;
  const us = voices.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("en-us"));
  return (
    us.find((v) => /samantha/i.test(v.name)) ??
    us.find((v) => FEMALE.test(v.name)) ??
    us.find((v) => !MALE.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en") && !MALE.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

/** Each speak() call gets a number; pieces from an older call are ignored. */
let speakRun = 0;

/** Split a reply into sentences (merging short ones, splitting very long ones at commas). */
export function speechChunks(text: string, max = 180): string[] {
  // Break after . ! ? followed by a space (so "3.5" and "$4.50" stay whole).
  const sentences = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?]["')\]]?)\s+/);
  const out: string[] = [];
  for (const raw of sentences) {
    let s = raw.trim();
    if (!s) continue;
    while (s.length > max) {
      const cut = Math.max(s.lastIndexOf(", ", max), s.lastIndexOf("; ", max), s.lastIndexOf(" ", max));
      const at = cut > max / 3 ? cut + 1 : max;
      out.push(s.slice(0, at).trim());
      s = s.slice(at).trim();
    }
    const last = out[out.length - 1];
    if (last && last.length + s.length + 1 <= max && last.length < 60) out[out.length - 1] = `${last} ${s}`;
    else if (s) out.push(s);
  }
  return out.length ? out : [text];
}

/**
 * Text-to-speech for Iris's replies (browser speech synthesis: Apple voices
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

  const speak = useCallback((text: string, opts: { force?: boolean; onEnd?: () => void; onStart?: () => void } = {}) => {
    if (!speechOutputSupported() || !text.trim() || (readMuted() && !opts.force)) {
      opts.onEnd?.();
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const run = ++speakRun;
    // Sentence-sized pieces: Chrome stops long utterances partway (~15 s),
    // and short pieces let a tap cut her off cleanly.
    const parts = speechChunks(text);
    const voice = pickVoice();
    const rate = getVoicePrefs().rate;
    let started = false;
    let ended = false;
    const finish = () => {
      if (ended) return;
      ended = true;
      if (run === speakRun) {
        setSpeaking(false);
        emitSignal({ speaking: false });
      }
      opts.onEnd?.();
    };
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      u.rate = rate;
      u.onstart = () => {
        if (run !== speakRun) return;
        setSpeaking(true);
        emitSignal({ speaking: true });
        if (!started) {
          started = true;
          opts.onStart?.();
        }
      };
      u.onboundary = (e) => {
        if (e.name === "word" || !e.name) emitSignal({ tick: voiceSignal.tick + 1 });
      };
      // Only the last piece ends the reply; a cancel (new reply or tap) ends it too.
      u.onend = () => {
        if (i === parts.length - 1 || run !== speakRun) finish();
      };
      u.onerror = finish;
      synth.speak(u);
    });
  }, []);

  const stop = useCallback(() => {
    speakRun++;
    if (speechOutputSupported()) window.speechSynthesis.cancel();
    setSpeaking(false);
    emitSignal({ speaking: false });
  }, []);

  return { supported, muted, setMuted, speak, prime, stop, speaking };
}
