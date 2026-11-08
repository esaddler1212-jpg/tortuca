import { arcBeatsForHero, battleworldLatticeStrength } from './arc-progress';

const SYNC_KEY = 'flight-nemulator-lattice-sync-token';
const LATTICE_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_BATTLEWORLD_LATTICE_URL?: string } }).env
      ?.VITE_BATTLEWORLD_LATTICE_URL) ||
  '/api/flight-nemulator-lattice';

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function syncToken(): string {
  let t = localStorage.getItem(SYNC_KEY);
  if (!t) {
    t = `bw-${crypto.randomUUID()}`;
    localStorage.setItem(SYNC_KEY, t);
  }
  return t;
}

export function queueBattleworldLatticeCloud(heroId: string): void {
  if (!navigator.onLine) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void pushBattleworldLatticeCloud(heroId);
  }, 1200);
}

export async function pullBattleworldLatticeCloud(heroId: string): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const res = await fetch(`${LATTICE_URL}?heroId=${encodeURIComponent(heroId)}&token=${encodeURIComponent(syncToken())}`);
    if (!res.ok) return false;
    const data = (await res.json()) as { lattice?: number; beats?: string[] };
    if (!data || Object.keys(data).length === 0) return false;
    if (typeof data.lattice === 'number') {
      localStorage.setItem('flight-nemulator-battleworld-lattice', String(data.lattice));
    }
    if (data.beats?.length) {
      for (const beat of data.beats) {
        localStorage.setItem(`flight-nemulator-arc-beat-${heroId}-${beat}`, '1');
      }
    }
    return true;
  } catch {
    return false;
  }
}

async function pushBattleworldLatticeCloud(heroId: string): Promise<void> {
  const beats = [...arcBeatsForHero(heroId)];
  try {
    await fetch(LATTICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: syncToken(),
        heroId,
        lattice: battleworldLatticeStrength(),
        beats
      })
    });
  } catch {
    /* offline-first */
  }
}
