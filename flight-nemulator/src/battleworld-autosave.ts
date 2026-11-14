import type { PlayerRole } from './player-role';
import type { SessionStats } from './session-persist';

export const AUTOSAVE_VERSION = 1;
const KEY = 'flight-nemulator-battleworld-autosave';

export type DefeatRecord = {
  profileId: string;
  codename: string;
  isPairBoss?: boolean;
};

export type BattleworldAutosave = {
  version: typeof AUTOSAVE_VERSION;
  savedAt: string;
  heroId: string;
  playerRole: PlayerRole;
  wave: number;
  waveCooldown: number;
  destructionUsd: number;
  foesStopped: number;
  wantedStars: number;
  cityIntegrityPct: number;
  pairBossSpawned: boolean;
  pairBossDefeated: boolean;
  pairBossWarned: boolean;
  position: { x: number; y: number; z: number };
  lastDefeat: DefeatRecord | null;
  sessionStats: SessionStats;
};

export function loadBattleworldAutosave(): BattleworldAutosave | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BattleworldAutosave;
    if (parsed.version !== AUTOSAVE_VERSION) return null;
    if (!parsed.heroId || !parsed.playerRole) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBattleworldAutosave(save: BattleworldAutosave): void {
  localStorage.setItem(KEY, JSON.stringify(save));
}

/** Static VantageGames bundle — no Netlify lattice API on vantagegames1. */
export function isBattleworldOfflineBundle(): boolean {
  const viteFlag =
    typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_BATTLEWORLD_OFFLINE_BUNDLE?: string } }).env
      ?.VITE_BATTLEWORLD_OFFLINE_BUNDLE === '1';
  if (viteFlag) return true;
  if (typeof location !== 'undefined' && /vantagegames/i.test(location.hostname)) return true;
  return false;
}

export function autosaveLabel(save: BattleworldAutosave | null): string | null {
  if (!save) return null;
  const t = new Date(save.savedAt);
  const time =
    Number.isNaN(t.getTime()) ? null : t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isBattleworldOfflineBundle()) {
    return time ? `Offline save (this device) · ${time}` : 'Offline save on this device';
  }
  if (!time) return 'Progress saved';
  return `Auto-saved ${time}`;
}

export function offlineLatticeHint(): string | null {
  if (!isBattleworldOfflineBundle()) return null;
  return 'Lattice cloud optional — VantageGames bundle keeps progress in browser storage';
}

export function buildBattleworldAutosave(
  input: Omit<BattleworldAutosave, 'version' | 'savedAt'> & { savedAt?: string }
): BattleworldAutosave {
  return {
    version: AUTOSAVE_VERSION,
    savedAt: input.savedAt ?? new Date().toISOString(),
    heroId: input.heroId,
    playerRole: input.playerRole,
    wave: input.wave,
    waveCooldown: input.waveCooldown,
    destructionUsd: input.destructionUsd,
    foesStopped: input.foesStopped,
    wantedStars: input.wantedStars,
    cityIntegrityPct: input.cityIntegrityPct,
    pairBossSpawned: input.pairBossSpawned,
    pairBossDefeated: input.pairBossDefeated,
    pairBossWarned: input.pairBossWarned,
    position: input.position,
    lastDefeat: input.lastDefeat,
    sessionStats: input.sessionStats
  };
}
