import { useEffect, useMemo, useRef } from "react";
import type { EmailMessage, TodoItem } from "../types";
import type { StocksSnapshot } from "../types/stocks";
import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";
import {
  buildOvernightDelta,
  buildVisitSnapshot,
  captureVisitSnapshot,
  getPreviousSnapshot,
} from "../lib/overnightDelta";

export function useOvernightDelta(
  unread: number,
  pending: TodoItem[],
  done: TodoItem[],
  urgentCount: number,
  stocks: StocksSnapshot | null,
  woodhouse: WoodhouseOrchestrationSnapshot | null,
  calendarEventCount: number,
  messages: EmailMessage[],
) {
  const captured = useRef(false);

  const current = useMemo(
    () =>
      buildVisitSnapshot(unread, pending, done, urgentCount, stocks, woodhouse, calendarEventCount),
    [unread, pending, done, urgentCount, stocks, woodhouse, calendarEventCount],
  );

  const delta = useMemo(() => {
    const prev = getPreviousSnapshot();
    return buildOvernightDelta(prev, current, messages);
  }, [current, messages]);

  useEffect(() => {
    if (captured.current) return;
    const timer = setTimeout(() => {
      captureVisitSnapshot(current);
      captured.current = true;
    }, 3000);
    return () => clearTimeout(timer);
  }, [current]);

  return delta;
}
