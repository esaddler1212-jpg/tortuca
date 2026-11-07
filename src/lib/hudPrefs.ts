import { dayKey } from "../../shared/timezone";

/** Local HUD layout prefs (not synced — device-specific). */

export type ParticleViz = "off" | "orbits" | "cortex" | "strata";

export interface HudPrefs {
  /** Reactor home (phone) + command deck (iPad) + particle core (combo 1+3+5). */
  combo135: boolean;
  particleViz: ParticleViz;
  /** Full-screen Futurist Lantern before HUD (once per day). */
  lanternUnlock: boolean;
  /** Red reactor ring accents on phone when combo is on. */
  reactorSkin: boolean;
  /** K.A.R.A. Original filament orb (canvas). */
  karaOrb: boolean;
}

const KEY = "iris-hud-prefs";

export const DEFAULT_HUD_PREFS: HudPrefs = {
  combo135: true,
  particleViz: "orbits",
  lanternUnlock: true,
  reactorSkin: false,
  karaOrb: true,
};

const PREFS_VER = 2;

export function loadHudPrefs(): HudPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_HUD_PREFS };
    const parsed = { ...DEFAULT_HUD_PREFS, ...JSON.parse(raw) } as HudPrefs & { _v?: number };
    if (parsed._v !== PREFS_VER) {
      const next: HudPrefs = {
        ...parsed,
        combo135: parsed.combo135 ?? true,
        karaOrb: true,
        particleViz: parsed.particleViz ?? DEFAULT_HUD_PREFS.particleViz,
      };
      localStorage.setItem(KEY, JSON.stringify({ ...next, _v: PREFS_VER }));
      return next;
    }
    const { _v: _ignore, ...prefs } = parsed;
    return prefs;
  } catch {
    return { ...DEFAULT_HUD_PREFS };
  }
}

export function saveHudPrefs(patch: Partial<HudPrefs>): HudPrefs {
  const next = { ...loadHudPrefs(), ...patch };
  localStorage.setItem(KEY, JSON.stringify({ ...next, _v: PREFS_VER }));
  return next;
}

export function lanternUnlockKey(timezone: string): string {
  return `iris-lantern-unlock-${dayKey(timezone)}`;
}

export function isLanternUnlockedToday(timezone: string): boolean {
  try {
    return localStorage.getItem(lanternUnlockKey(timezone)) === "1";
  } catch {
    return false;
  }
}

export function markLanternUnlockedToday(timezone: string): void {
  localStorage.setItem(lanternUnlockKey(timezone), "1");
}
