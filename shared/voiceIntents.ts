/**
 * Voice fast path — adapted from Herald OS intents.ts (MIT).
 * Navigate HUD modules without a model round-trip when the utterance is navigation-only.
 */

import { matchModuleFromSpeech, moduleLabel, type HudModuleId } from "./hudModules";

const FILLERS = [
  /^(hey|ok|okay|hi|hello|yo)(?:[,!\s]|\.(?=\s|$))+((iris|iros|i\.?ris|boss|girl)(?:[,!\s]|\.(?=\s|$))*)?/i,
  /^(iris|iros)(?:[,!\s]|\.(?=\s|$))+/i,
  /^(please|now)[,\s]+/i,
  /^(can|could|would|will) you (please )?/i,
  /^(i want to|i'?d like to|i would like to|i need to|let'?s|just)\s+/i,
  /^(go ahead and|please go ahead and)\s+/i,
];

const TRAILERS = [/[,\s]+please$/i, /[,\s]+(for me|now|thanks|thank you)$/i, /[,\s]+(iris|boss)$/i];

/** Drop wake words and politeness; keep user casing for display. */
export function stripVoiceFillers(text: string): string {
  let out = text.replace(/['']/g, "'").replace(/\s+/g, " ").trim();
  for (let i = 0; i < 3; i++) {
    for (const filler of FILLERS) out = out.replace(filler, "");
    for (const trailer of TRAILERS) out = out.replace(trailer, "");
  }
  return out.trim();
}

const NAV_VERB = /\b(open|show|bring up|pull up|go to|switch to|take me to)\b/i;
/** Multi-intent cues — still send to /api/ask. */
const HEAVY = /\b(and then|and also|also|summarize|summary|read|explain|what|why|how|tell me|check my|email|draft|remind|delegate)\b/i;

/**
 * Open a HUD module locally when the utterance is clearly navigation-only (saves latency + tokens).
 */
export function fastModuleNavigation(text: string): HudModuleId | null {
  const stripped = stripVoiceFillers(text);
  if (!stripped || !NAV_VERB.test(stripped)) return null;
  if (HEAVY.test(stripped)) return null;
  const words = stripped.split(/\s+/).length;
  if (words > 12) return null;
  return matchModuleFromSpeech(stripped);
}

export function fastModuleAck(id: HudModuleId): string {
  return `Opening ${moduleLabel(id)}.`;
}
