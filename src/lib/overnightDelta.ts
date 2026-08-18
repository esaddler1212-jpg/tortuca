import type { EmailMessage } from "../types";
import type { TodoItem } from "../types";
import type { StocksSnapshot } from "../types/stocks";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";
import { loadJson, saveJson } from "./storage";

const SNAPSHOT_KEY = "alfred-visit-snapshot";

export interface VisitSnapshot {
  at: string;
  unreadCount: number;
  pendingTodoCount: number;
  completedTodoCount: number;
  urgentCount: number;
  topStockMovers: Array<{ symbol: string; changePercent: number }>;
  woodhouseOffline: string[];
  calendarEventCount: number;
}

export interface OvernightDelta {
  headline: string;
  lines: string[];
  isFirstVisit: boolean;
}

function loadSnapshot(): VisitSnapshot | null {
  return loadJson<VisitSnapshot | null>(SNAPSHOT_KEY, null);
}

function saveSnapshot(snapshot: VisitSnapshot): void {
  saveJson(SNAPSHOT_KEY, snapshot);
}

function formatAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const hours = Math.round((Date.now() - then) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function buildVisitSnapshot(
  unread: number,
  pending: TodoItem[],
  done: TodoItem[],
  urgentCount: number,
  stocks: StocksSnapshot | null,
  woodhouse: WoodhouseOrchestrationSnapshot | null,
  calendarEventCount: number,
): VisitSnapshot {
  const movers = [...(stocks?.watchlist ?? [])]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 3)
    .map((q) => ({ symbol: q.symbol, changePercent: q.changePercent }));

  return {
    at: new Date().toISOString(),
    unreadCount: unread,
    pendingTodoCount: pending.length,
    completedTodoCount: done.length,
    urgentCount,
    topStockMovers: movers,
    woodhouseOffline: woodhouse?.nodes.filter((n) => !n.ok).map((n) => n.displayName) ?? [],
    calendarEventCount,
  };
}

export function buildOvernightDelta(
  prev: VisitSnapshot | null,
  current: VisitSnapshot,
  messages: EmailMessage[],
): OvernightDelta {
  if (!prev) {
    return {
      headline: "Briefing ready",
      lines: ["First check-in today — Alfred is tracking changes from here."],
      isFirstVisit: true,
    };
  }

  const lines: string[] = [];
  const since = formatAgo(prev.at);
  const newUnread = messages.filter(
    (m) => m.unread && new Date(m.date) > new Date(prev.at),
  ).length;

  if (newUnread > 0) {
    lines.push(`${newUnread} new unread email${newUnread === 1 ? "" : "s"}.`);
  } else if (current.unreadCount > 0) {
    lines.push(`${current.unreadCount} unread in inbox.`);
  }

  const todosDone = current.completedTodoCount - prev.completedTodoCount;
  if (todosDone > 0) {
    lines.push(`${todosDone} task${todosDone === 1 ? "" : "s"} completed since last check.`);
  }
  const todosAdded = current.pendingTodoCount - prev.pendingTodoCount;
  if (todosAdded > 0) {
    lines.push(`${todosAdded} new open task${todosAdded === 1 ? "" : "s"}.`);
  }

  if (current.urgentCount > prev.urgentCount) {
    lines.push(`${current.urgentCount - prev.urgentCount} more urgent item${current.urgentCount - prev.urgentCount === 1 ? "" : "s"}.`);
  }

  for (const mover of current.topStockMovers) {
    const old = prev.topStockMovers.find((m) => m.symbol === mover.symbol);
    if (!old || Math.abs(mover.changePercent - old.changePercent) >= 0.5) {
      const sign = mover.changePercent >= 0 ? "+" : "";
      lines.push(`${mover.symbol} ${sign}${mover.changePercent.toFixed(1)}%.`);
    }
  }

  if (current.woodhouseOffline.length > prev.woodhouseOffline.length) {
    const newly = current.woodhouseOffline.filter((n) => !prev.woodhouseOffline.includes(n));
    if (newly.length) lines.push(`${newly.join(", ")} went offline.`);
  }

  if (lines.length === 0) {
    lines.push("All quiet since your last check — no major changes.");
  }

  return {
    headline: `Since you last checked (${since})`,
    lines,
    isFirstVisit: false,
  };
}

export function captureVisitSnapshot(snapshot: VisitSnapshot): void {
  saveSnapshot(snapshot);
}

export function getPreviousSnapshot(): VisitSnapshot | null {
  return loadSnapshot();
}
