/**
 * Focus modes: what Alfred puts in front of E at a given time.
 *
 * - school   Weekdays 6 AM until school dismissal: Family Purpose focus.
 * - network  Weekday afternoons/evenings (and overnight): ECS Network focus
 *            (Easy Supply, the roadmap, revenue). Shown with the green theme.
 * - weekend  Saturdays and Sundays: the Vantage briefing, big picture only.
 * - holiday  School holidays on weekdays: same as weekend.
 * - vantage  Picked from the header's Focus menu: the Vantage Point briefing
 *            on demand (same big-picture view, any day).
 *
 * Out-of-focus apps keep their scheduled events (meetings, group sessions,
 * milestones) but hide their tasks, follow-ups and check-ins.
 */
import { NO_SCHOOL_DAYS, dismissalTime } from "./schoolCalendar";
import { dayKey, isWeekendDay, localHour, weekdayOfDay, zonedDateTime } from "./timezone";

export type DayMode = "school" | "network" | "weekend" | "holiday" | "vantage";

/** What the header's Focus menu offers. "auto" follows the clock. */
export type FocusChoice = "auto" | "school" | "network" | "vantage";

export const FOCUS_CHOICE_LABEL: Record<FocusChoice, string> = {
  auto: "Auto (follows the clock)",
  school: "Family Purpose",
  network: "ECS Network",
  vantage: "Vantage Point briefing",
};

/** The mode in effect: a manual choice wins; "auto" uses the clock's mode. */
export function resolveMode(auto: DayMode, choice: FocusChoice): DayMode {
  return choice === "auto" ? auto : choice;
}

/** Modes that show the big-picture Vantage view (purple). */
export function isVantageMode(mode: DayMode): boolean {
  return mode === "weekend" || mode === "holiday" || mode === "vantage";
}

/** School-hours focus starts at 6 AM. */
export const SCHOOL_FOCUS_START_HOUR = 6;

export function dayMode(timeZone: string, now = new Date()): DayMode {
  const day = dayKey(timeZone, now);
  if (isWeekendDay(day)) return "weekend";
  if (NO_SCHOOL_DAYS.has(day)) return "holiday";
  const dismissal = zonedDateTime(day, dismissalTime(day, weekdayOfDay(day)), timeZone);
  return localHour(timeZone, now) >= SCHOOL_FOCUS_START_HOUR && now < dismissal ? "school" : "network";
}

export const DAY_MODE_LABEL: Record<DayMode, string> = {
  school: "School hours · Family Purpose",
  network: "ECS Network",
  weekend: "Weekend · Vantage briefing",
  holiday: "School holiday · Vantage briefing",
  vantage: "Vantage Point briefing",
};

/** Which Woodhouse node types are in focus for each mode. */
export const FOCUS_NODE_TYPES: Record<DayMode, ReadonlySet<string>> = {
  school: new Set(["education"]),
  network: new Set(["commerce", "ops", "media", "custom"]),
  weekend: new Set(["ops"]),
  holiday: new Set(["ops"]),
  vantage: new Set(["ops"]),
};

/** Calendar kinds that are real scheduled events (kept in every mode). Others are tasks. */
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
 * Keep the in-focus apps' tasks; for the rest keep only scheduled events.
 * Every node stays listed (so the Network panel still shows it online).
 */
export function applyDayMode<C extends CalendarItemLike, N extends NodeLike<C>, O extends OrchestrationLike<C, N>>(
  snapshot: O | null,
  mode: DayMode,
): O | null {
  if (!snapshot) return snapshot;
  const focus = FOCUS_NODE_TYPES[mode];
  const nodes = snapshot.nodes.map((node) => {
    if (focus.has(node.nodeType) || !node.snapshot) return node;
    return {
      ...node,
      snapshot: {
        ...node.snapshot,
        summary: `Not in focus (${DAY_MODE_LABEL[mode]})`,
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
