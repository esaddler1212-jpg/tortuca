/** JARVIS / FRIDAY motion + chrome skins (see docs/IRIS_PERSONA_UI.md). */

export type VoicePersonaPref = "auto" | "jarvis" | "friday";
export type VoicePersona = "jarvis" | "friday";

export function resolveVoicePersona(
  pref: VoicePersonaPref,
  opts: { voiceDeckOpen: boolean; phaseActive: boolean; focus: string },
): VoicePersona {
  if (pref === "jarvis") return "jarvis";
  if (pref === "friday") return "friday";
  if (opts.voiceDeckOpen || opts.phaseActive) return "friday";
  if (opts.focus === "network") return "friday";
  return "jarvis";
}
