import { DISTRICTS } from './districts';
import { latticeFetchHeaders, latticeRequestHeaders, tortucaSessionId } from './tortuca-auth';

const LOCAL_CONTRIB = 'flight-nemulator-room-goal-contrib';
const ROOM_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_BATTLEWORLD_ROOM_GOAL_URL?: string } }).env
      ?.VITE_BATTLEWORLD_ROOM_GOAL_URL) ||
  '/api/battleworld-room-goal';

export type RoomGoalState = {
  weekId: string;
  districtId: string;
  districtLabel: string;
  target: number;
  tally: number;
  localContrib: number;
  label: string;
};

function isoWeekId(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function weeklyDistrict(weekId: string): (typeof DISTRICTS)[number] {
  let hash = 0;
  for (let i = 0; i < weekId.length; i++) hash = (hash * 31 + weekId.charCodeAt(i)) >>> 0;
  return DISTRICTS[hash % DISTRICTS.length]!;
}

export function currentRoomGoalLocal(): RoomGoalState {
  const weekId = isoWeekId();
  const district = weeklyDistrict(weekId);
  const target = 120;
  let localContrib = 0;
  try {
    const raw = localStorage.getItem(LOCAL_CONTRIB);
    if (raw) {
      const parsed = JSON.parse(raw) as { weekId?: string; n?: number };
      if (parsed.weekId === weekId) localContrib = Math.max(0, Number(parsed.n) || 0);
    }
  } catch {
    /* */
  }
  return {
    weekId,
    districtId: district.id,
    districtLabel: district.label,
    target,
    tally: localContrib,
    localContrib,
    label: `Room goal: ${district.label} — clear takeovers & waves`
  };
}

export function contribRoomGoal(delta = 1): void {
  const weekId = isoWeekId();
  const goal = currentRoomGoalLocal();
  const n = goal.localContrib + delta;
  localStorage.setItem(LOCAL_CONTRIB, JSON.stringify({ weekId, n }));
  void pushRoomGoalContrib(weekId, delta);
}

async function pushRoomGoalContrib(weekId: string, delta: number): Promise<void> {
  if (!navigator.onLine) return;
  try {
    await fetch(ROOM_URL, {
      method: 'POST',
      headers: latticeRequestHeaders(),
      body: JSON.stringify({ weekId, delta, session: tortucaSessionId() ?? undefined })
    });
  } catch {
    /* offline */
  }
}

export async function pullRoomGoalTally(): Promise<RoomGoalState> {
  const local = currentRoomGoalLocal();
  if (!navigator.onLine) return local;
  try {
    const q = `weekId=${encodeURIComponent(local.weekId)}`;
    const res = await fetch(`${ROOM_URL}?${q}`, { headers: latticeFetchHeaders() });
    if (!res.ok) return local;
    const data = (await res.json()) as { tally?: number; target?: number };
    const tally = Math.max(local.localContrib, Number(data.tally) || 0);
    const target = Number(data.target) || local.target;
    return { ...local, tally, target };
  } catch {
    return local;
  }
}

export function roomGoalHudLine(state: RoomGoalState): string {
  const pct = Math.min(100, Math.round((state.tally / state.target) * 100));
  return `${state.label} (${state.tally}/${state.target} · ${pct}% room)`;
}