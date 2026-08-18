import type { CalendarEvent, TodoItem } from "../types";

export interface OvercommitmentWarning {
  level: "warn" | "heavy";
  message: string;
  reasons: string[];
}

export function assessOvercommitment(
  pendingTodos: TodoItem[],
  urgentCount: number,
  todayTimeline: CalendarEvent[],
  dismissed = false,
): OvercommitmentWarning | null {
  if (dismissed) return null;

  const reasons: string[] = [];
  const eventCount = todayTimeline.length;
  const pendingCount = pendingTodos.length;

  if (pendingCount > 8) reasons.push(`${pendingCount} open tasks`);
  else if (pendingCount > 5) reasons.push(`${pendingCount} tasks on your plate`);

  if (urgentCount > 2) reasons.push(`${urgentCount} urgent items`);
  else if (urgentCount > 0 && eventCount >= 4) reasons.push(`${urgentCount} urgent with a packed calendar`);

  if (eventCount >= 6) reasons.push(`${eventCount} events today`);
  else if (eventCount >= 4 && pendingCount > 3) reasons.push(`${eventCount} events plus open tasks`);

  if (reasons.length === 0) return null;

  const heavy =
    pendingCount > 8 ||
    urgentCount > 2 ||
    eventCount >= 6 ||
    (urgentCount > 0 && eventCount >= 5);

  return {
    level: heavy ? "heavy" : "warn",
    message: heavy
      ? "Tomorrow may not forgive a late night — consider trimming the list."
      : "Busy day ahead — prioritize ruthlessly.",
    reasons,
  };
}
