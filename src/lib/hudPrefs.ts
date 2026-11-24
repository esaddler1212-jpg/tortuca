import type { VoicePersonaPref } from "./voicePersona";
import { DEFAULT_IRIS_ORB_STYLE, type IrisOrbStyleId, isIrisOrbStyleId } from "../../shared/irisOrbStyles";

/** Local HUD layout prefs (not synced — device-specific). */

export type ParticleViz = "off" | "orbits" | "cortex" | "strata";

export interface HudPrefs {
  /** Reactor home (phone) + command deck (iPad) + particle core (combo 1+3+5). */
  combo135: boolean;
  particleViz: ParticleViz;
  /** Red reactor ring accents on phone when combo is on. */
  reactorSkin: boolean;
  /** K.A.R.A. Original filament orb (canvas). */
  karaOrb: boolean;
  /** JARVIS calm vs FRIDAY voice energy (see docs/IRIS_PERSONA_UI.md). */
  voicePersona: VoicePersonaPref;
  /** Home + dock talking orb layout (see docs/IRIS_ORB_OPTIONS.md). */
  irisOrbStyle: IrisOrbStyleId;
}

const KEY = "iris-hud-prefs";

export const DEFAULT_HUD_PREFS: HudPrefs = {
  combo135: true,
  particleViz: "orbits",
  reactorSkin: false,
  karaOrb: true,
  voicePersona: "auto",
  irisOrbStyle: DEFAULT_IRIS_ORB_STYLE,
};

const PREFS_VER = 5;

export function loadHudPrefs(): HudPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_HUD_PREFS };
    const parsed = { ...DEFAULT_HUD_PREFS, ...JSON.parse(raw) } as HudPrefs & {
      _v?: number;
      lanternUnlock?: boolean;
    };
    if (parsed._v !== PREFS_VER) {
      const prevStyle = isIrisOrbStyleId(parsed.irisOrbStyle ?? "") ? parsed.irisOrbStyle : DEFAULT_HUD_PREFS.irisOrbStyle;
      const irisOrbStyle =
        parsed._v === 4 && prevStyle === "ops-console" ? DEFAULT_HUD_PREFS.irisOrbStyle : prevStyle;
      const next: HudPrefs = {
        combo135: parsed.combo135 ?? true,
        karaOrb: parsed.karaOrb ?? true,
        particleViz: parsed.particleViz ?? DEFAULT_HUD_PREFS.particleViz,
        reactorSkin: parsed.reactorSkin ?? DEFAULT_HUD_PREFS.reactorSkin,
        voicePersona: parsed.voicePersona ?? DEFAULT_HUD_PREFS.voicePersona,
        irisOrbStyle,
      };
      localStorage.setItem(KEY, JSON.stringify({ ...next, _v: PREFS_VER }));
      return next;
    }
    delete parsed._v;
    delete (parsed as { lanternUnlock?: boolean }).lanternUnlock;
    return parsed;
  } catch {
    return { ...DEFAULT_HUD_PREFS };
  }
}

export function saveHudPrefs(patch: Partial<HudPrefs>): HudPrefs {
  const next = { ...loadHudPrefs(), ...patch };
  localStorage.setItem(KEY, JSON.stringify({ ...next, _v: PREFS_VER }));
  return next;
}
