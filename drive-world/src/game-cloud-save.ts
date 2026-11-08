import type { SavedProgress } from './game-progress';
import { loadProgress, saveProgress } from './game-progress';

const SYNC_KEY = 'city-nights-sync-key';
const API = import.meta.env.VITE_CITY_NIGHTS_API ?? '/.netlify/functions/city-nights-progress';

export function getOrCreateSyncKey(): string {
  let key = localStorage.getItem(SYNC_KEY);
  if (!key) {
    key = `cn-${crypto.randomUUID()}`;
    localStorage.setItem(SYNC_KEY, key);
  }
  return key;
}

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-City-Nights-Sync': getOrCreateSyncKey()
  };
}

export async function pullCloudProgress(): Promise<SavedProgress | null> {
  try {
    const res = await fetch(API, { method: 'GET', headers: headers() });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const body = (await res.json()) as { progress?: SavedProgress };
    return body.progress ?? null;
  } catch {
    return null;
  }
}

export async function pushCloudProgress(progress: SavedProgress): Promise<boolean> {
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ progress })
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** On boot: merge cloud if newer landmark count, else keep local. */
export async function tryMergeCloudOnBoot(): Promise<void> {
  const local = loadProgress();
  const remote = await pullCloudProgress();
  if (!remote || (remote.version !== 5 && remote.version !== 6)) return;
  const localScore =
    local.visitedLandmarkIds.length * 10 + local.unlockedVehicleIds.length * 5 + local.collectedIds.length;
  const remoteScore =
    remote.visitedLandmarkIds.length * 10 + remote.unlockedVehicleIds.length * 5 + remote.collectedIds.length;
  if (remoteScore > localScore) {
    saveProgress({ ...remote, version: 6, tacoTrucksFound: remote.tacoTrucksFound ?? [] });
  } else if (localScore > remoteScore) {
    await pushCloudProgress(local);
  }
}

export function exportProgressJson(): string {
  return JSON.stringify(loadProgress(), null, 2);
}

export function importProgressJson(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw) as SavedProgress;
    if (parsed.version !== 5 && parsed.version !== 6) return false;
    saveProgress({ ...parsed, version: 6, tacoTrucksFound: parsed.tacoTrucksFound ?? [] });
    return true;
  } catch {
    return false;
  }
}
