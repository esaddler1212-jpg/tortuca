import { contribRoomGoal } from './battleworld-room-goal';

const DAILY_KEY = 'flight-nemulator-daily-mission';

export type DailyMission = {
  dayId: string;
  seasonId: string;
  title: string;
  hint: string;
  done: boolean;
};

const MISSION_POOL: { title: string; hint: string }[] = [
  { title: 'Lattice patrol', hint: 'Clear one takeover district or stop a wave' },
  { title: 'Stone sweep', hint: 'Visit an infinity stone site' },
  { title: 'Safe house rest', hint: 'Press H at any safe house' },
  { title: 'Room builder', hint: 'Add credit toward this week’s shared district goal' },
  { title: 'Pair scout', hint: 'Reach wave 8+ without dropping below 45% city integrity' }
];

function dayId(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function seasonId(date = new Date()): string {
  const m = date.getUTCMonth();
  const q = Math.floor(m / 3) + 1;
  return `${date.getUTCFullYear()}-Q${q}`;
}

function missionIndex(heroId: string, day: string): number {
  let h = 0;
  const seed = `${heroId}:${day}`;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  return h % MISSION_POOL.length;
}

export function dailyMissionFor(heroId: string): DailyMission {
  const day = dayId();
  const pick = MISSION_POOL[missionIndex(heroId, day)]!;
  let done = false;
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { dayId?: string; done?: boolean };
      done = parsed.dayId === day && !!parsed.done;
    }
  } catch {
    /* */
  }
  return {
    dayId: day,
    seasonId: seasonId(),
    title: pick.title,
    hint: pick.hint,
    done
  };
}

export function completeDailyMission(heroId: string, kind: 'wave' | 'stone' | 'safe' | 'room' | 'integrity'): void {
  const mission = dailyMissionFor(heroId);
  const map: Record<string, typeof kind> = {
    'Lattice patrol': 'wave',
    'Stone sweep': 'stone',
    'Safe house rest': 'safe',
    'Room builder': 'room',
    'Pair scout': 'integrity'
  };
  if (map[mission.title] !== kind) return;
  localStorage.setItem(DAILY_KEY, JSON.stringify({ dayId: mission.dayId, done: true }));
  if (kind === 'room') contribRoomGoal(1);
}

export function dailyMissionHudLine(m: DailyMission): string {
  if (m.done) return `Daily · ${m.title} ✓ (${m.seasonId})`;
  return `Daily · ${m.title} — ${m.hint}`;
}