import type { TodoItem } from "../types";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";

export type TodayActionSource = "todo" | "woodhouse" | "follow-up" | "overdue";

export interface TodayAction {
  id: string;
  title: string;
  source: TodayActionSource;
  sourceLabel: string;
  urgent: boolean;
  /** Lower = sooner */
  sort: number;
  todoId?: string;
}

export function buildTodayQueue(
  pendingTodos: TodoItem[],
  woodhouse: WoodhouseOrchestrationSnapshot | null,
): TodayAction[] {
  const items: TodayAction[] = [];
  const today = new Intl.DateTimeFormat("en-CA").format(new Date());

  for (const node of woodhouse?.nodes ?? []) {
    for (const action of node.snapshot?.priorityActions ?? []) {
      const urgent = /overdue|approval|due today|urgent/i.test(action);
      items.push({
        id: `wh-${node.registryId}-${action}`,
        title: action,
        source: "woodhouse",
        sourceLabel: node.displayName,
        urgent,
        sort: urgent ? 0 : 2,
      });
    }
    for (const cal of node.snapshot?.calendar ?? []) {
      if (cal.kind === "follow_up_overdue") {
        items.push({
          id: `fu-${cal.id}`,
          title: cal.title,
          source: "overdue",
          sourceLabel: "Family Purpose",
          urgent: true,
          sort: -1,
        });
      } else if (cal.kind === "follow_up_due") {
        items.push({
          id: `fu-${cal.id}`,
          title: cal.title,
          source: "follow-up",
          sourceLabel: "Family Purpose",
          urgent: true,
          sort: 0,
        });
      }
    }
  }

  for (const t of pendingTodos) {
    const dueToday = t.dueDate === today;
    items.push({
      id: `todo-${t.id}`,
      title: t.title,
      source: "todo",
      sourceLabel: "To-do",
      urgent: dueToday,
      sort: dueToday ? 1 : 3,
      todoId: t.id,
    });
  }

  const seen = new Set<string>();
  return items
    .filter((i) => {
      const k = i.title.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title));
}
