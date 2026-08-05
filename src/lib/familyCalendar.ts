import type { CalendarEvent } from "../types";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";

export function orchestrationToCalendarEvents(
  snapshot: WoodhouseOrchestrationSnapshot,
): CalendarEvent[] {
  return snapshot.calendar
    .filter((item) => item.kind !== "school_day")
    .map((item) => ({
      id: `wh-${item.id}`,
      title: item.title,
      start: item.start,
      end: item.end,
      location: item.kind.replace(/_/g, " "),
      source: "family-purpose" as const,
    }));
}
