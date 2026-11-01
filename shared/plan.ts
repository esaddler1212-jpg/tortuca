/**
 * Plan logic (pure, testable): progress by goal, what's on deck this week and
 * month, the year countdown, catch-up nudges, and the daily creative spark log.
 */
import { PLAN_TASKS, YEAR_GOALS, type Area, type PlanTask, type YearGoal } from "./planData";
import { sparkFor, type Spark } from "./sparks";
import { addDays, dayKey, weekdayOfDay } from "./timezone";

/** One day's creative spark: when it was done, how many shuffles, an optional note. */
export interface SparkEntry {
  done?: string;
  shuffle?: number;
  note?: string;
}

/** A Claude-ready task handed off: Claude is working on it, or it's back for your OK. */
export type HandoffStatus = "working" | "review";
export interface Handoff {
  status: HandoffStatus;
  at: string;
}

/** Monthly AI spend: a budget and what's on it (Claude, voice, hosting…). */
export interface AiBudget {
  monthly: number;
  items: { id: string; name: string; amount: number }[];
}

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
  /** YYYY-MM-DD → that day's creative spark. */
  sparkLog: Record<string, SparkEntry>;
  /** taskId → hand-off state (cleared when approved or sent back). */
  handoffs: Record<string, Handoff>;
  budget: AiBudget;
  updatedAt: string;
}

export const EMPTY_PLAN: PlanState = {
  done: {},
  hidden: [],
  customTasks: [],
  goals: null,
  sparkLog: {},
  handoffs: {},
  budget: { monthly: 50, items: [] },
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

// ── Daily creative spark ─────────────────────────────────────────────────

/** Today's spark (respects "Another one" shuffles). */
export function todaySpark(state: PlanState, today: string): Spark {
  return sparkFor(today, state.sparkLog[today]?.shuffle ?? 0);
}

export function sparkDone(state: PlanState, day: string): boolean {
  return Boolean(state.sparkLog[day]?.done);
}

/** Monday of the week containing `day`. */
export function weekStart(day: string): string {
  const offset: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return addDays(day, -offset[weekdayOfDay(day)]);
}

/** This week (Mon–Sun): which days the spark got done. */
export function sparkWeek(state: PlanState, today: string): { done: number; days: { day: string; label: string; done: boolean; future: boolean }[] } {
  const start = weekStart(today);
  const days = [0, 1, 2, 3, 4, 5, 6].map((n) => {
    const day = addDays(start, n);
    return { day, label: weekdayOfDay(day), done: sparkDone(state, day), future: day > today };
  });
  return { done: days.filter((d) => d.done).length, days };
}

/** Consecutive days with a spark done (today counts once done, never breaks it). */
export function sparkStreak(state: PlanState, today: string): number {
  let streak = 0;
  let day = today;
  for (let i = 0; i < 400; i++) {
    if (sparkDone(state, day)) streak++;
    else if (day !== today) break;
    day = addDays(day, -1);
  }
  return streak;
}

/** Sparks done per week over the last `weeks` weeks (for the Year view). */
export function sparkHistory(state: PlanState, today: string, weeks: number): { weekOf: string; done: number; possible: number }[] {
  const out: { weekOf: string; done: number; possible: number }[] = [];
  let start = weekStart(today);
  for (let i = 0; i < weeks; i++) {
    out.unshift({ weekOf: start, done: sparkWeek(state, addDays(start, 6)).done, possible: 7 });
    start = addDays(start, -7);
  }
  return out;
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

// ── Agent desk (hand-offs) and AI budget ─────────────────────────────────

/** Tasks Claude can take on (fully or with you). */
export function canHandOff(task: PlanTask): boolean {
  return task.ai !== "you";
}

/** Handed-off tasks still open: waiting on your OK first, then with Claude. */
export function handoffQueue(state: PlanState): { review: PlanTask[]; working: PlanTask[] } {
  const open = allTasks(state).filter((t) => !isDone(state, t) && state.handoffs[t.id]);
  return {
    review: open.filter((t) => state.handoffs[t.id].status === "review"),
    working: open.filter((t) => state.handoffs[t.id].status === "working"),
  };
}

export function budgetTotal(budget: AiBudget): number {
  return budget.items.reduce((n, i) => n + (Number.isFinite(i.amount) ? i.amount : 0), 0);
}
