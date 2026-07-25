import type { CheckIn, FollowUp } from "./types";
import { FOLLOW_UP_WINDOW_HOURS } from "./types";
import { dayKeyOf } from "./reports";

const HOUR_MS = 3_600_000;

export type FollowUpState = "overdue" | "dueToday" | "upcoming" | "done";

export interface FollowUpItem {
  checkIn: CheckIn;
  followUp: FollowUp;
  state: FollowUpState;
}

export interface FollowUpQueue {
  overdue: FollowUpItem[];
  dueToday: FollowUpItem[];
  upcoming: FollowUpItem[];
  done: FollowUpItem[];
  /** Everything still owed, oldest deadline first. */
  open: FollowUpItem[];
}

/** A follow-up raised now is owed within the standard window. */
export function createFollowUp(
  checkInCreatedAt: string,
  overrides: Partial<FollowUp> = {},
): FollowUp {
  return {
    dueAt: new Date(
      Date.parse(checkInCreatedAt) + FOLLOW_UP_WINDOW_HOURS * HOUR_MS,
    ).toISOString(),
    notes: "",
    services: [],
    careTeamReferral: false,
    ...overrides,
  };
}

export function followUpState(
  followUp: FollowUp,
  now: Date = new Date(),
): FollowUpState {
  if (followUp.completedAt) return "done";
  if (Date.parse(followUp.dueAt) <= now.getTime()) return "overdue";
  return dayKeyOf(followUp.dueAt) === dayKeyOf(now.toISOString())
    ? "dueToday"
    : "upcoming";
}

function byDueDate(a: FollowUpItem, b: FollowUpItem): number {
  return a.followUp.dueAt.localeCompare(b.followUp.dueAt);
}

export function buildFollowUpQueue(
  checkIns: CheckIn[],
  now: Date = new Date(),
): FollowUpQueue {
  const items: FollowUpItem[] = checkIns
    .filter((c): c is CheckIn & { followUp: FollowUp } => Boolean(c.followUp))
    .map((c) => ({
      checkIn: c,
      followUp: c.followUp,
      state: followUpState(c.followUp, now),
    }));

  const bucket = (state: FollowUpState) =>
    items.filter((i) => i.state === state).sort(byDueDate);

  const overdue = bucket("overdue");
  const dueToday = bucket("dueToday");
  const upcoming = bucket("upcoming");

  return {
    overdue,
    dueToday,
    upcoming,
    // Most recently handled first: that is what you want to glance back at.
    done: bucket("done").sort((a, b) =>
      (b.followUp.completedAt ?? "").localeCompare(a.followUp.completedAt ?? ""),
    ),
    open: [...overdue, ...dueToday, ...upcoming],
  };
}

/**
 * Check-ins still missing an outcome, newest first. Older than the cutoff they
 * drop off the list: a two-week-old blank is not a task any more.
 */
export function needsOutcome(
  checkIns: CheckIn[],
  now: Date = new Date(),
  withinDays = 7,
): CheckIn[] {
  const cutoff = now.getTime() - withinDays * 24 * HOUR_MS;
  return checkIns
    .filter((c) => !c.outcome && Date.parse(c.createdAt) >= cutoff)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function careTeamReferrals(checkIns: CheckIn[]): CheckIn[] {
  return checkIns
    .filter((c) => c.followUp?.careTeamReferral)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

export function formatDueLabel(
  followUp: FollowUp,
  now: Date = new Date(),
): string {
  if (followUp.completedAt) {
    return `Followed up ${formatStamp(followUp.completedAt)}`;
  }

  const diffMs = Date.parse(followUp.dueAt) - now.getTime();
  const hours = Math.round(Math.abs(diffMs) / HOUR_MS);

  if (diffMs <= 0) {
    if (hours < 1) return "Due now";
    return hours < 24
      ? `Overdue by ${plural(hours, "hour")}`
      : `Overdue by ${plural(Math.floor(hours / 24), "day")}`;
  }
  if (hours < 24) return `Due in ${plural(hours, "hour")}`;
  return `Due ${formatStamp(followUp.dueAt)}`;
}

export function formatStamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "Maria Lopez (ID 10482)" when an ID is on file, otherwise just the name. */
export function studentLabel(checkIn: CheckIn): string {
  const id = checkIn.studentId?.trim();
  return id ? `${checkIn.studentName} (ID ${id})` : checkIn.studentName;
}
