/**
 * Plan logic (pure, testable): progress by goal, what's on deck this week and
 * month, the year countdown, catch-up nudges, and MWFS scores/streaks.
 */
import { PLAN_TASKS, YEAR_GOALS, type Area, type PlanTask, type YearGoal } from "./planData";
import { addDays, dayKey, weekdayOfDay } from "./timezone";

export type MwfsHabit = "music" | "meditate" | "master";
export const MWFS_HABITS: MwfsHabit[] = ["music", "meditate", "master"];
export const MWFS_DAYS = new Set(["Mon", "Wed", "Fri", "Sat"]);

/** Everything the user changes, synced across devices. */
export interface PlanState {
  /** taskId → ISO time it was completed. */
  done: Record<string, string>;
  /** Seed tasks the user removed. */
  hidden: string[];
  /** Tasks the user added. */
  customTasks: PlanTask[];
  /** User-edited goals; null = use the built-in goals. */
  goals: YearGoal[] | null;
  /** YYYY-MM-DD → habits done that day. */
  mwfsLog: Record<string, Partial<Record<MwfsHabit, boolean>>>;
  updatedAt: string;
}

export const EMPTY_PLAN: PlanState = {
  done: {},
  hidden: [],
  customTasks: [],
  goals: null,
  mwfsLog: {},
  updatedAt: new Date(0).toISOString(),
};

export function allGoals(state: PlanState): YearGoal[] {
  return state.goals ?? YEAR_GOALS;
}

export function allTasks(state: PlanState): PlanTask[] {
  const hidden = new Set(state.hidden);
  return [...PLAN_TASKS.filter((t) => !hidden.has(t.id)), ...state.customTasks];
}

export function isDone(state: PlanState, task: PlanTask): boolean {
  return Boolean(task.doneAtStart || state.done[task.id]);
}

export function monthKey(day: string): string {
  return day.slice(0, 7);
}

export function goalProgress(state: PlanState, goalId: string): { done: number; total: number } {
  const tasks = allTasks(state).filter((t) => t.goalId === goalId);
  return { done: tasks.filter((t) => isDone(state, t)).length, total: tasks.length };
}

/** Open tasks due this month or earlier (overdue first), in plan order. */
export function openTasksThrough(state: PlanState, month: string): PlanTask[] {
  return allTasks(state)
    .filter((t) => !isDone(state, t) && t.month <= month)
    .sort((a, b) => a.month.localeCompare(b.month));
}

/** This month's tasks (all, done or not) plus overdue open ones. */
export function monthTasks(state: PlanState, month: string): PlanTask[] {
  return allTasks(state)
    .filter((t) => t.month === month || (t.month < month && !isDone(state, t)))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/** Focus areas for each mode (school hours keep ECS work off the list). */
const MODE_AREAS: Record<string, ReadonlySet<Area> | null> = {
  school: new Set<Area>([]),
  network: null, // all ECS areas
  weekend: null,
  holiday: null,
  vantage: null,
};

/** The week's focus: up to `limit` open tasks, overdue first, filtered by mode. */
export function weekFocus(state: PlanState, today: string, mode: string, limit = 5): PlanTask[] {
  const areas = MODE_AREAS[mode] ?? null;
  return openTasksThrough(state, monthKey(today))
    .filter((t) => !areas || areas.has(t.area))
    .slice(0, limit);
}

export function daysLeftInYear(today: string): number {
  const [y] = today.split("-").map(Number);
  const end = Date.UTC(y, 11, 31);
  const [yy, mm, dd] = today.split("-").map(Number);
  return Math.round((end - Date.UTC(yy, mm - 1, dd)) / 86_400_000);
}

export interface Nudge {
  goalId: string;
  text: string;
  urgent: boolean;
}

/**
 * Catch-up nudges for the current year's goals: open tasks whose month has
 * arrived, and how many days are left to finish them.
 */
export function nudges(state: PlanState, today: string): Nudge[] {
  const year = Number(today.slice(0, 4));
  const month = monthKey(today);
  const out: Nudge[] = [];
  for (const g of allGoals(state).filter((g) => g.year === year)) {
    const tasks = allTasks(state).filter((t) => t.goalId === g.id);
    if (!tasks.length) continue;
    const overdue = tasks.filter((t) => !isDone(state, t) && t.month < month).length;
    const dueNow = tasks.filter((t) => !isDone(state, t) && t.month === month).length;
    const left = tasks.filter((t) => !isDone(state, t)).length;
    if (!left) continue;
    if (overdue) out.push({ goalId: g.id, urgent: true, text: `${g.title}: ${overdue} overdue, ${left} left` });
    else if (dueNow) out.push({ goalId: g.id, urgent: false, text: `${g.title}: ${dueNow} due this month` });
  }
  const days = daysLeftInYear(today);
  if (days <= 75) {
    const open = allGoals(state)
      .filter((g) => g.year === year)
      .map((g) => goalProgress(state, g.id))
      .reduce((n, p) => n + (p.total - p.done), 0);
    if (open) out.unshift({ goalId: "year", urgent: days <= 30, text: `${days} days left in ${year}: ${open} task${open === 1 ? "" : "s"} still open` });
  }
  return out;
}

// ── MWFS ────────────────────────────────────────────────────────────────

export function mwfsDoneOn(state: PlanState, day: string): number {
  const log = state.mwfsLog[day] ?? {};
  return MWFS_HABITS.filter((h) => log[h]).length;
}

/** Monday of the week containing `day`. */
export function weekStart(day: string): string {
  const offset: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return addDays(day, -offset[weekdayOfDay(day)]);
}

/** This week's MWFS score: habits done / possible on Mon, Wed, Fri, Sat. */
export function mwfsWeek(state: PlanState, today: string): { done: number; possible: number; days: { day: string; label: string; done: number; future: boolean }[] } {
  const start = weekStart(today);
  const days = [0, 2, 4, 5].map((n) => {
    const day = addDays(start, n);
    return { day, label: weekdayOfDay(day), done: mwfsDoneOn(state, day), future: day > today };
  });
  return { done: days.reduce((n, d) => n + d.done, 0), possible: days.length * MWFS_HABITS.length, days };
}

/** Consecutive past MWFS days with all three habits done (today counts once complete). */
export function mwfsStreak(state: PlanState, today: string): number {
  let streak = 0;
  let day = today;
  for (let i = 0; i < 400; i++) {
    if (MWFS_DAYS.has(weekdayOfDay(day))) {
      const full = mwfsDoneOn(state, day) === MWFS_HABITS.length;
      if (full) streak++;
      else if (day !== today) break; // today can still be in progress
    }
    day = addDays(day, -1);
  }
  return streak;
}

/** MWFS completion over the last `weeks` weeks (for the month/year views). */
export function mwfsHistory(state: PlanState, today: string, weeks: number): { weekOf: string; done: number; possible: number }[] {
  const out: { weekOf: string; done: number; possible: number }[] = [];
  let start = weekStart(today);
  for (let i = 0; i < weeks; i++) {
    const w = mwfsWeek(state, addDays(start, 6));
    out.unshift({ weekOf: start, done: w.done, possible: w.possible });
    start = addDays(start, -7);
  }
  return out;
}

export function todayIsMwfsDay(today: string): boolean {
  return MWFS_DAYS.has(weekdayOfDay(today));
}

export function dayKeyIn(timeZone: string, now: Date): string {
  return dayKey(timeZone, now);
}

/** Plan tasks completed today (for Do today's "Done today"). */
export function planTasksDoneOn(plan: PlanState, day: string, timeZone: string): PlanTask[] {
  return allTasks(plan).filter((t) => {
    const at = plan.done[t.id];
    return at && new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(at)) === day;
  });
}
