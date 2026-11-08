export type SessionStats = {
  destructionUsd: number;
  wavesCleared: number;
  dronesDestroyed: number;
  supersUsed: number;
  updatedAt: string;
};

const KEY = 'flight-nemulator-session-stats';

export function loadSessionStats(): SessionStats {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    return { ...fresh(), ...(JSON.parse(raw) as SessionStats) };
  } catch {
    return fresh();
  }
}

function fresh(): SessionStats {
  return {
    destructionUsd: 0,
    wavesCleared: 0,
    dronesDestroyed: 0,
    supersUsed: 0,
    updatedAt: new Date().toISOString()
  };
}

export function saveSessionStats(patch: Partial<SessionStats>): SessionStats {
  const next = { ...loadSessionStats(), ...patch, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
