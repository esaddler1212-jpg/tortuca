import { arcBeatsForHero, battleworldLatticeStrength, mergeLatticeFromCloud } from './arc-progress';
import { latticeFetchHeaders, latticeRequestHeaders } from './tortuca-auth';

const SYNC_KEY = 'flight-nemulator-lattice-sync-token';
const LATTICE_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_BATTLEWORLD_LATTICE_URL?: string } }).env
      ?.VITE_BATTLEWORLD_LATTICE_URL) ||
  '/api/flight-nemulator-lattice';

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let lastPullLabel: string | null = null;

export function consumeLatticeCloudLabel(): string | null {
  const v = lastPullLabel;
  lastPullLabel = null;
  return v;
}

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
    const q = `heroId=${encodeURIComponent(heroId)}&token=${encodeURIComponent(syncToken())}`;
    const res = await fetch(`${LATTICE_URL}?${q}`, { headers: latticeFetchHeaders() });
    if (res.status === 401) {
      lastPullLabel = 'Sign in on Tortuca to sync lattice';
      return false;
    }
    if (!res.ok) return false;
    const data = (await res.json()) as { lattice?: number; beats?: string[] };
    if (!data || Object.keys(data).length === 0) return false;
    const merged = mergeLatticeFromCloud(heroId, Number(data.lattice) || 0, data.beats ?? []);
    if (merged) lastPullLabel = 'Lattice synced from cloud';
    return merged;
  } catch {
    return false;
  }
}

async function pushBattleworldLatticeCloud(heroId: string): Promise<void> {
  const beats = [...arcBeatsForHero(heroId)];
  try {
    const res = await fetch(LATTICE_URL, {
      method: 'POST',
      headers: latticeRequestHeaders(),
      body: JSON.stringify({
        token: syncToken(),
        heroId,
        lattice: battleworldLatticeStrength(),
        beats
      })
    });
    if (res.status === 401) lastPullLabel = 'Sign in on Tortuca to save lattice';
  } catch {
    /* offline-first */
  }
}
