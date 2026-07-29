import type { CalendarEvent } from "../types";
import type { WoodhouseFamilyPurposeNode } from "../types/woodhouse";

const KIND_LABEL: Record<string, string> = {
  group_meeting: "Meeting",
  follow_up_due: "Follow-up",
  follow_up_overdue: "Overdue follow-up",
  check_in_today: "Check-in",
};

export function familyCalendarToEvents(node: WoodhouseFamilyPurposeNode): CalendarEvent[] {
  return node.calendar
    .filter((item) => item.kind !== "school_day")
    .map((item) => ({
      id: `fp-${item.id}`,
      title: item.title,
      start: item.start,
      end: item.end,
      location: KIND_LABEL[item.kind] ?? "Family Purpose",
      source: "family-purpose" as const,
    }));
}
