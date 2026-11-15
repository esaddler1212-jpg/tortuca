/**
 * Timed reminders Iris sets by voice ("remind me at 4 to call Mike", "in 30
 * minutes"). Saved on the account; the reminder-check job (every 10 minutes)
 * pushes each one to E's devices when it comes due. Pure logic here.
 */
import { clockTime, dayKey, zonedDateTime } from "./timezone";

export interface IrisReminder {
  id: string;
  text: string;
  /** When to ping, ISO (UTC). */
  at: string;
  createdAt: string;
  sentAt?: string;
}

export const MAX_REMINDERS = 50;
const MAX_AHEAD_MS = 90 * 86_400_000;
/** The job runs every 10 minutes, so fire up to 5 minutes early rather than up to 10 late. */
export const FIRE_EARLY_MS = 5 * 60_000;
/** Don't ping for something that came due long ago (e.g. notifications were off). */
const STALE_MS = 6 * 3_600_000;

/** Local date + 24h time in IRIS's time zone → ISO instant, or null if invalid or not in the future. */
export function reminderInstant(date: string, time: string, timeZone: string, now = new Date()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]?\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const at = zonedDateTime(date, time.padStart(5, "0"), timeZone);
  const ms = at.getTime();
  if (!Number.isFinite(ms) || ms <= now.getTime() - 60_000 || ms - now.getTime() > MAX_AHEAD_MS) return null;
  return at.toISOString();
}

export function addReminder(list: IrisReminder[] | undefined, text: string, at: string, now = new Date()): IrisReminder[] {
  const clean = text.trim().replace(/\s+/g, " ").slice(0, 140);
  if (!clean) return list ?? [];
  const existing = pruneReminders(list, now);
  // Saying it twice shouldn't ping twice.
  if (existing.some((r) => !r.sentAt && r.at === at && r.text.toLowerCase() === clean.toLowerCase())) return existing;
  const id = `rem-${now.getTime().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  return [...existing, { id, text: clean, at, createdAt: now.toISOString() }].slice(-MAX_REMINDERS);
}

/** Reminders to push on this run. */
export function dueReminders(list: IrisReminder[] | undefined, now = new Date()): IrisReminder[] {
  const t = now.getTime();
  return (list ?? []).filter((r) => {
    if (r.sentAt) return false;
    const at = Date.parse(r.at);
    return Number.isFinite(at) && at <= t + FIRE_EARLY_MS && at > t - STALE_MS;
  });
}

/** Drop sent reminders after two days and unsent ones that went stale. */
export function pruneReminders(list: IrisReminder[] | undefined, now = new Date()): IrisReminder[] {
  const t = now.getTime();
  return (list ?? []).filter((r) => {
    if (r.sentAt) return t - Date.parse(r.sentAt) < 2 * 86_400_000;
    return Date.parse(r.at) > t - STALE_MS;
  });
}

/** "today 4:00 PM", "tomorrow 9:00 AM", "Fri, Nov 20 9:00 AM". */
export function reminderWhen(at: string, timeZone: string, now = new Date()): string {
  const d = new Date(at);
  const day = dayKey(timeZone, d);
  const today = dayKey(timeZone, now);
  const tomorrow = dayKey(timeZone, new Date(now.getTime() + 86_400_000));
  const label =
    day === today
      ? "today"
      : day === tomorrow
        ? "tomorrow"
        : d.toLocaleDateString("en-US", { timeZone, weekday: "short", month: "short", day: "numeric" });
  return `${label} ${clockTime(d, timeZone)}`;
}

/** One line for Iris's notes so she can answer "what reminders do I have?". */
export function remindersContext(list: IrisReminder[] | undefined, timeZone: string, now = new Date()): string {
  const open = (list ?? []).filter((r) => !r.sentAt && Date.parse(r.at) > now.getTime() - FIRE_EARLY_MS).sort((a, b) => a.at.localeCompare(b.at));
  if (!open.length) return "";
  return `Reminders set (his phone gets a notification then): ${open
    .slice(0, 8)
    .map((r) => `${r.text} (${reminderWhen(r.at, timeZone, now)})`)
    .join("; ")}.`;
}

/** Find the open to-do E means ("check off the sponsor deck"): exact title first, then best word overlap. */
export function matchTodo<T extends { id: string; title: string }>(todos: T[], query: string): T | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const exact = todos.find((t) => t.title.trim().toLowerCase() === q);
  if (exact) return exact;
  const words = (s: string) => s.toLowerCase().split(/[^a-z0-9$]+/).filter((w) => w.length > 2 && !/^(the|and|for|with|about|that|this|from)$/.test(w));
  const want = words(q);
  if (!want.length) return null;
  let best: { todo: T; score: number } | null = null;
  for (const todo of todos) {
    const have = new Set(words(todo.title));
    const hit = want.filter((w) => have.has(w)).length;
    const score = hit / want.length;
    if (hit && (!best || score > best.score)) best = { todo, score };
  }
  return best && best.score >= 0.5 ? best.todo : null;
}
