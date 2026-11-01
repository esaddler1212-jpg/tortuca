/**
 * Workday vs off-duty modes.
 *
 * Work apps (Family Purpose / education) only matter during the workday:
 * Mon–Fri, not a school holiday, 6 AM–7 PM. Outside that, their tasks and
 * follow-ups are hidden; their calendar events (meetings, group sessions)
 * still show, because a scheduled event is still something to be at.
 */
import { NO_SCHOOL_DAYS } from "./schoolCalendar";
import { dayKey, isWeekendDay, localHour } from "./timezone";

export type DayMode = "workday" | "evening" | "weekend" | "holiday";

/** Workday hours (local, 24h): work items show from 6 AM until 7 PM. */
export const WORK_DAY_START_HOUR = 6;
export const WORK_DAY_END_HOUR = 19;

export function dayMode(timeZone: string, now = new Date()): DayMode {
  const day = dayKey(timeZone, now);
  if (isWeekendDay(day)) return "weekend";
  if (NO_SCHOOL_DAYS.has(day)) return "holiday";
  const hour = localHour(timeZone, now);
  return hour >= WORK_DAY_START_HOUR && hour < WORK_DAY_END_HOUR ? "workday" : "evening";
}

export function isOffDuty(mode: DayMode): boolean {
  return mode !== "workday";
}

export const DAY_MODE_LABEL: Record<DayMode, string> = {
  workday: "Workday",
  evening: "Off duty (after hours)",
  weekend: "Weekend",
  holiday: "School holiday",
};

/** Node types whose tasks are work-only. */
export const WORK_NODE_TYPES = new Set(["education"]);

/** Calendar kinds that are real scheduled events (kept off duty). Others are tasks. */
const EVENT_KINDS = new Set(["meeting", "group_meeting", "event", "milestone", "deadline"]);

interface CalendarItemLike {
  kind: string;
}
interface NodeLike<C extends CalendarItemLike> {
  nodeType: string;
  snapshot: {
    summary: string;
    priorityActions: string[];
    calendar?: C[];
  } | null;
}
interface OrchestrationLike<C extends CalendarItemLike, N extends NodeLike<C>> {
  nodes: N[];
  priorityActions: string[];
  calendar: C[];
}

/**
 * Hide work-app tasks when off duty. Keeps the node (so it still shows as
 * online) and its scheduled events; drops its priority actions, follow-ups
 * and check-ins. Returns the snapshot unchanged during the workday.
 */
export function applyDayMode<C extends CalendarItemLike, N extends NodeLike<C>, O extends OrchestrationLike<C, N>>(
  snapshot: O | null,
  mode: DayMode,
): O | null {
  if (!snapshot || !isOffDuty(mode)) return snapshot;
  const nodes = snapshot.nodes.map((node) => {
    if (!WORK_NODE_TYPES.has(node.nodeType) || !node.snapshot) return node;
    return {
      ...node,
      snapshot: {
        ...node.snapshot,
        summary: `Off duty (${DAY_MODE_LABEL[mode].toLowerCase()})`,
        priorityActions: [],
        calendar: (node.snapshot.calendar ?? []).filter((c) => EVENT_KINDS.has(c.kind)),
      },
    };
  });
  return {
    ...snapshot,
    nodes,
    priorityActions: [...new Set(nodes.flatMap((n) => n.snapshot?.priorityActions ?? []))],
    calendar: nodes.flatMap((n) => n.snapshot?.calendar ?? []),
  };
}
