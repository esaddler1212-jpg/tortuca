/** Curated labels and sorting for Iris (browser speechSynthesis voices). */

export type VoiceTier = "premium" | "enhanced" | "standard";

/** Friendly tier from the voice name (Apple/Google often embed Enhanced/Premium). */
export function voiceTier(name: string): VoiceTier {
  if (/\bpremium\b/i.test(name)) return "premium";
  if (/\benhanced\b/i.test(name)) return "enhanced";
  return "standard";
}

export function tierLabel(tier: VoiceTier): string {
  if (tier === "premium") return "Premium";
  if (tier === "enhanced") return "Enhanced";
  return "Standard";
}

/** Voices that usually sound best as Iris on Apple devices (shown first when installed). */
export const IRIS_VOICE_RECOMMENDATIONS: { match: RegExp; short: string }[] = [
  { match: /samantha.*enhanced|enhanced.*samantha/i, short: "Samantha Enhanced" },
  { match: /^samantha$/i, short: "Samantha" },
  { match: /ava.*premium|premium.*ava|^ava$/i, short: "Ava" },
  { match: /zoe.*premium|premium.*zoe|^zoe$/i, short: "Zoe" },
  { match: /nicky.*premium|premium.*nicky|^nicky$/i, short: "Nicky" },
  { match: /joelle/i, short: "Joelle" },
  { match: /serena/i, short: "Serena" },
  { match: /karen/i, short: "Karen" },
  { match: /moira/i, short: "Moira (British)" },
  { match: /tessa/i, short: "Tessa (Australian)" },
  { match: /google.*english.*female|google us english/i, short: "Google US English" },
  { match: /\bjenny\b/i, short: "Jenny" },
  { match: /\baria\b/i, short: "Aria" },
  { match: /\bmichelle\b/i, short: "Michelle" },
  { match: /\bemma\b/i, short: "Emma (British)" },
  { match: /\bsonia\b/i, short: "Sonia (British)" },
  { match: /\bnatasha\b/i, short: "Natasha (Australian)" },
  { match: /\bclara\b/i, short: "Clara" },
  { match: /\bsusan\b/i, short: "Susan" },
  { match: /\ballison\b/i, short: "Allison" },
  { match: /\bkate\b/i, short: "Kate" },
  { match: /\bstephanie\b/i, short: "Stephanie" },
];

export function isRecommendedIrisVoice(name: string): boolean {
  return IRIS_VOICE_RECOMMENDATIONS.some((r) => r.match.test(name));
}

export function recommendedShortLabel(name: string): string | null {
  const hit = IRIS_VOICE_RECOMMENDATIONS.find((r) => r.match.test(name));
  return hit?.short ?? null;
}

/** Display line in Settings: "Samantha Enhanced · American · Premium" */
export function irisVoiceOptionLabel(v: SpeechSynthesisVoice, accent: string): string {
  const nick = recommendedShortLabel(v.name);
  const tier = tierLabel(voiceTier(v.name));
  const base = nick && nick !== v.name ? `${nick} (${v.name})` : v.name;
  return `${base} · ${accent} · ${tier}`;
}

export function recommendationRank(name: string): number {
  const i = IRIS_VOICE_RECOMMENDATIONS.findIndex((r) => r.match.test(name));
  return i < 0 ? 999 : i;
}

export function tierRank(name: string): number {
  const t = voiceTier(name);
  return t === "premium" ? 0 : t === "enhanced" ? 1 : 2;
}
