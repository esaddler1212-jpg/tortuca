import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";
import { localHour } from "../../shared/timezone";

function fpMetrics(woodhouse: WoodhouseOrchestrationSnapshot | null): {
  checkInsToday: number;
  followUpsOverdue: number;
} {
  const node = woodhouse?.nodes.find((n) => n.registryId === "family-purpose");
  const metrics = node?.snapshot?.metrics ?? [];
  const num = (key: string) => {
    const v = metrics.find((m) => m.key === key)?.value;
    return typeof v === "number" ? v : Number(v) || 0;
  };
  return {
    checkInsToday: num("checkins"),
    followUpsOverdue: num("overdue"),
  };
}

/** School-hours nudge: send debrief from Family Purpose — counts only, no student names. */
export function FamilyPurposeDebriefBanner({
  mode,
  timeZone,
  woodhouse,
  familyPurposeAppUrl,
}: {
  mode: string;
  timeZone: string;
  woodhouse: WoodhouseOrchestrationSnapshot | null;
  familyPurposeAppUrl?: string;
}) {
  if (mode !== "school") return null;
  const hour = localHour(timeZone, new Date());
  if (hour < 14) return null;

  const { checkInsToday, followUpsOverdue } = fpMetrics(woodhouse);
  if (checkInsToday === 0 && followUpsOverdue === 0) return null;

  const parts: string[] = [];
  if (checkInsToday > 0) {
    parts.push(
      `${checkInsToday} check-in${checkInsToday === 1 ? "" : "s"} logged today`,
    );
  }
  if (followUpsOverdue > 0) {
    parts.push(
      `${followUpsOverdue} overdue follow-up${followUpsOverdue === 1 ? "" : "s"}`,
    );
  }

  const href = familyPurposeAppUrl?.trim() || undefined;

  return (
    <div className="panel border-amber-400/30 bg-amber-950/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <p className="text-sm font-medium text-amber-100">Family Purpose — end-of-day debrief</p>
        <p className="text-xs text-amber-200/80 mt-0.5">
          {parts.join(" · ")}. Open Family Purpose → Debrief when you&apos;re ready to send staff
          the daily summary (student names stay in that app only).
        </p>
      </div>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold text-center text-sm whitespace-nowrap shrink-0"
        >
          Open Family Purpose
        </a>
      )}
    </div>
  );
}
