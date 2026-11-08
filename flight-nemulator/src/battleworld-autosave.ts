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

export function autosaveLabel(save: BattleworldAutosave | null): string | null {
  if (!save) return null;
  const t = new Date(save.savedAt);
  if (Number.isNaN(t.getTime())) return 'Progress saved';
  return `Auto-saved ${t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
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
