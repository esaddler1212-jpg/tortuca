/**
 * Speech shaping for Iris TTS — adapted from Herald OS
 * (https://github.com/iamlukethedev/Herald-OS, MIT).
 * Strips markdown/URLs/code before browser speechSynthesis.
 */

const SENTENCE_END = /([.!?…]+["')\]]*)(\s+|$)/;

/** Remove markdown and other unspeakable syntax; returns plain prose. */
export function sanitizeForSpeech(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, " ")
    .replace(/<think>[\s\S]*?<\/redacted_thinking>/gi, " ")
    .replace(/```[\s\S]*?```/g, " code omitted. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/gi, "a link")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\|/g, " ")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/^-{3,}\s*$/gm, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export class SentenceChunker {
  private buffer = "";

  get pending(): string {
    return this.buffer;
  }

  feed(delta: string): string[] {
    this.buffer += delta;
    const out: string[] = [];

    for (;;) {
      const paragraph = this.buffer.indexOf("\n\n");
      const match = SENTENCE_END.exec(this.buffer);
      const sentenceEnd = match && match[2].length > 0 ? match.index + match[1].length : -1;

      if (paragraph === -1 && sentenceEnd === -1) break;

      const cut = paragraph !== -1 && (sentenceEnd === -1 || paragraph < sentenceEnd) ? paragraph : sentenceEnd;
      const sentence = this.buffer.slice(0, cut).trim();
      this.buffer = this.buffer.slice(cut).replace(/^\s+/, "");

      if (sentence) out.push(sentence);
    }

    return out;
  }

  flush(): string[] {
    const rest = this.buffer.trim();
    this.buffer = "";
    return rest ? [rest] : [];
  }

  reset(): void {
    this.buffer = "";
  }
}

/** ~5 minutes of speech at typical TTS rate. */
export const SYSTEM_VOICE_MAX_CHARS = 5000;

/** Iris stop phrases when the utterance is only this (punctuation ignored). */
export const DEFAULT_STOP_PHRASES = [
  "stop",
  "stop listening",
  "that's all",
  "that is all",
  "thanks iris",
  "thank you iris",
  "goodbye",
  "bye",
  "never mind",
  "nevermind",
  "cancel",
] as const;

export function isStopPhrase(text: string, phrases: readonly string[] = DEFAULT_STOP_PHRASES): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return false;

  return phrases.some((phrase) => {
    const p = phrase.toLowerCase().trim();
    return (
      normalized === p ||
      normalized === `${p} iris` ||
      normalized === `iris ${p}` ||
      normalized === `okay ${p}` ||
      normalized === `ok ${p}`
    );
  });
}

const NOISE_TRANSCRIPTS = new Set([
  "",
  "you",
  "thank you",
  "thanks for watching",
  "bye",
  ".",
  "the",
  "uh",
  "um",
  "hmm",
  "mm",
]);

export function isNoiseTranscript(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return NOISE_TRANSCRIPTS.has(normalized) || normalized.length < 2;
}

function piecesUpTo(sentence: string, maxChars: number): string[] {
  const out: string[] = [];
  let rest = sentence.trim();

  while (rest.length > maxChars) {
    const head = rest.slice(0, maxChars + 1);
    const pause = Math.max(head.lastIndexOf(", "), head.lastIndexOf("; "), head.lastIndexOf(": "));
    const space = head.lastIndexOf(" ");
    const cut = pause > maxChars / 2 ? pause + 1 : space > maxChars / 2 ? space : maxChars;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }

  return rest ? [...out, rest] : out;
}

/**
 * Short first chunk so TTS starts quickly, then larger pieces (Herald system-voice pattern).
 */
export function chunkForSystemVoice(text: string, firstMax = 200, restMax = 180, maxTotal = SYSTEM_VOICE_MAX_CHARS): string[] {
  const cleaned = sanitizeForSpeech(text);
  if (!cleaned) return [];

  const chunker = new SentenceChunker();
  const sentences = [...chunker.feed(cleaned), ...chunker.flush()].map((s) => s.replace(/\s+/g, " "));
  const pieces = sentences.flatMap((sentence, index) => piecesUpTo(sentence, index === 0 ? firstMax : restMax));
  const out: string[] = [];
  let current = "";
  let total = 0;

  for (const piece of pieces) {
    total += piece.length + 1;
    if (total > maxTotal + 1) break;

    const joined = current ? `${current} ${piece}` : piece;
    const cap = out.length === 0 ? firstMax : restMax;
    if (current && joined.length > cap) {
      out.push(current);
      current = piece;
    } else {
      current = joined;
    }
  }

  return current ? [...out, current] : out;
}
