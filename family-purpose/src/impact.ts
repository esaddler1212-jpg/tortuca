import type {
  CheckIn,
  CheckInOutcome,
  DebriefSettings,
  GroupSession,
  ReasonCategory,
} from "./types";
import { REASON_CATEGORY_ORDER, categoryOf } from "./types";
import { dayKeyOf, type DateRange } from "./reports";

export interface StudentEngagement {
  name: string;
  grade: string;
  checkIns: number;
  firstSeen: string;
  lastSeen: string;
  /** Whole weeks between the first and last check-in. */
  weeksEngaged: number;
}

export interface EngagementSummary {
  studentsSeen: number;
  returning: number;
  returningShare: number;
  sustained: number;
  averagePerStudent: number;
  students: StudentEngagement[];
}

export interface MemberAttendance {
  name: string;
  attended: number;
  rate: number;
}

export interface AttendanceTrend {
  sessionsHeld: number;
  averageAttendance: number;
  monthly: { label: string; average: number; sessions: number }[];
  earlierAverage: number;
  laterAverage: number;
  change: number;
  members: MemberAttendance[];
}

export interface CategoryShift {
  category: ReasonCategory;
  earlierShare: number;
  laterShare: number;
  change: number;
}

export interface ReasonMixShift {
  /** Null when there is too little data to split the period in two. */
  split: { earlier: DateRange; later: DateRange } | null;
  categories: CategoryShift[];
}

export interface OutcomeMix {
  recorded: number;
  missing: number;
  recordedShare: number;
  counts: { outcome: CheckInOutcome; count: number; share: number }[];
}

export interface ImpactReport {
  range: DateRange;
  engagement: EngagementSummary;
  attendance: AttendanceTrend;
  reasonMix: ReasonMixShift;
  outcomes: OutcomeMix;
}

const DAY_MS = 86_400_000;

function round(value: number, places = 1): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function inRange(day: string, range: DateRange): boolean {
  return day >= range.start && day <= range.end;
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function monthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

function weeksBetween(first: string, last: string): number {
  const days = (Date.parse(last) - Date.parse(first)) / DAY_MS;
  return Math.max(0, Math.floor(days / 7));
}

function summariseEngagement(checkIns: CheckIn[]): EngagementSummary {
  const byStudent = new Map<string, StudentEngagement>();

  for (const c of checkIns) {
    const key = normalize(c.studentName);
    if (!key) continue;
    const day = dayKeyOf(c.createdAt);
    const existing = byStudent.get(key);
    if (!existing) {
      byStudent.set(key, {
        name: c.studentName.trim(),
        grade: c.grade,
        checkIns: 1,
        firstSeen: day,
        lastSeen: day,
        weeksEngaged: 0,
      });
      continue;
    }
    existing.checkIns += 1;
    if (day < existing.firstSeen) existing.firstSeen = day;
    if (day > existing.lastSeen) {
      existing.lastSeen = day;
      existing.grade = c.grade;
    }
  }

  const students = [...byStudent.values()]
    .map((s) => ({ ...s, weeksEngaged: weeksBetween(s.firstSeen, s.lastSeen) }))
    .sort((a, b) => b.checkIns - a.checkIns || a.name.localeCompare(b.name));

  const returning = students.filter((s) => s.checkIns >= 2).length;

  return {
    studentsSeen: students.length,
    returning,
    returningShare: students.length
      ? Math.round((returning / students.length) * 100)
      : 0,
    sustained: students.filter((s) => s.checkIns >= 4).length,
    averagePerStudent: students.length
      ? round(checkIns.length / students.length)
      : 0,
    students,
  };
}

function summariseAttendance(sessions: GroupSession[]): AttendanceTrend {
  const held = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const total = held.reduce((sum, s) => sum + s.attendees.length, 0);

  const byMonth = new Map<string, { total: number; sessions: number }>();
  for (const s of held) {
    const month = s.date.slice(0, 7);
    const entry = byMonth.get(month) ?? { total: 0, sessions: 0 };
    entry.total += s.attendees.length;
    entry.sessions += 1;
    byMonth.set(month, entry);
  }

  const attendanceCounts = new Map<string, { name: string; attended: number }>();
  for (const s of held) {
    for (const attendee of new Set(s.attendees.map(normalize))) {
      const original =
        s.attendees.find((a) => normalize(a) === attendee)?.trim() ?? attendee;
      const entry = attendanceCounts.get(attendee) ?? {
        name: original,
        attended: 0,
      };
      entry.attended += 1;
      attendanceCounts.set(attendee, entry);
    }
  }

  const midpoint = Math.floor(held.length / 2);
  const average = (list: GroupSession[]) =>
    list.length
      ? round(list.reduce((sum, s) => sum + s.attendees.length, 0) / list.length)
      : 0;
  const earlierAverage = average(held.slice(0, midpoint));
  const laterAverage = average(held.slice(midpoint));

  return {
    sessionsHeld: held.length,
    averageAttendance: held.length ? round(total / held.length) : 0,
    monthly: [...byMonth]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, entry]) => ({
        label: monthLabel(month),
        average: round(entry.total / entry.sessions),
        sessions: entry.sessions,
      })),
    earlierAverage,
    laterAverage,
    change: held.length >= 2 ? round(laterAverage - earlierAverage) : 0,
    members: [...attendanceCounts.values()]
      .map((m) => ({
        ...m,
        rate: held.length ? Math.round((m.attended / held.length) * 100) : 0,
      }))
      .sort((a, b) => b.attended - a.attended || a.name.localeCompare(b.name)),
  };
}

function categoryShares(checkIns: CheckIn[]): Map<ReasonCategory, number> {
  const counts = new Map<ReasonCategory, number>();
  let total = 0;
  for (const c of checkIns) {
    for (const reason of c.reasons) {
      const category = categoryOf(reason);
      counts.set(category, (counts.get(category) ?? 0) + 1);
      total += 1;
    }
  }
  const shares = new Map<ReasonCategory, number>();
  for (const category of REASON_CATEGORY_ORDER) {
    shares.set(
      category,
      total ? Math.round(((counts.get(category) ?? 0) / total) * 100) : 0,
    );
  }
  return shares;
}

/**
 * Splits the period at the midpoint of the days actually logged, so a quiet
 * stretch at either end does not push all the data into one half.
 */
function splitByActivity(
  checkIns: CheckIn[],
): { earlier: CheckIn[]; later: CheckIn[]; range: ReasonMixShift["split"] } {
  const days = [...new Set(checkIns.map((c) => dayKeyOf(c.createdAt)))].sort();
  if (days.length < 2) {
    return { earlier: [], later: [], range: null };
  }

  const first = Date.parse(`${days[0]}T00:00:00`);
  const last = Date.parse(`${days[days.length - 1]}T00:00:00`);
  const midpoint = new Date(first + (last - first) / 2);
  const midpointDay = dayKeyOf(midpoint.toISOString());

  const earlier = checkIns.filter((c) => dayKeyOf(c.createdAt) <= midpointDay);
  const later = checkIns.filter((c) => dayKeyOf(c.createdAt) > midpointDay);
  if (earlier.length === 0 || later.length === 0) {
    return { earlier: [], later: [], range: null };
  }

  return {
    earlier,
    later,
    range: {
      earlier: {
        start: days[0],
        end: midpointDay,
        label: `${days[0]} to ${midpointDay}`,
      },
      later: {
        start: days.find((d) => d > midpointDay)!,
        end: days[days.length - 1],
        label: `${days.find((d) => d > midpointDay)!} to ${days[days.length - 1]}`,
      },
    },
  };
}

function summariseReasonMix(checkIns: CheckIn[]): ReasonMixShift {
  const { earlier, later, range } = splitByActivity(checkIns);
  if (!range) {
    const shares = categoryShares(checkIns);
    return {
      split: null,
      categories: REASON_CATEGORY_ORDER.map((category) => ({
        category,
        earlierShare: 0,
        laterShare: shares.get(category) ?? 0,
        change: 0,
      })),
    };
  }

  const earlierShares = categoryShares(earlier);
  const laterShares = categoryShares(later);

  return {
    split: range,
    categories: REASON_CATEGORY_ORDER.map((category) => {
      const earlierShare = earlierShares.get(category) ?? 0;
      const laterShare = laterShares.get(category) ?? 0;
      return {
        category,
        earlierShare,
        laterShare,
        change: laterShare - earlierShare,
      };
    }),
  };
}

function summariseOutcomes(checkIns: CheckIn[]): OutcomeMix {
  const counts = new Map<CheckInOutcome, number>();
  let recorded = 0;
  for (const c of checkIns) {
    if (!c.outcome) continue;
    recorded += 1;
    counts.set(c.outcome, (counts.get(c.outcome) ?? 0) + 1);
  }

  return {
    recorded,
    missing: checkIns.length - recorded,
    recordedShare: checkIns.length
      ? Math.round((recorded / checkIns.length) * 100)
      : 0,
    counts: [...counts]
      .map(([outcome, count]) => ({
        outcome,
        count,
        share: recorded ? Math.round((count / recorded) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count || a.outcome.localeCompare(b.outcome)),
  };
}

export function buildImpactReport(
  checkIns: CheckIn[],
  sessions: GroupSession[],
  range: DateRange,
): ImpactReport {
  const inPeriod = checkIns.filter((c) => inRange(dayKeyOf(c.createdAt), range));
  const sessionsInPeriod = sessions.filter((s) => inRange(s.date, range));

  return {
    range,
    engagement: summariseEngagement(inPeriod),
    attendance: summariseAttendance(sessionsInPeriod),
    reasonMix: summariseReasonMix(inPeriod),
    outcomes: summariseOutcomes(inPeriod),
  };
}

function signed(value: number, suffix = ""): string {
  const rounded = round(value);
  if (rounded > 0) return `+${rounded}${suffix}`;
  return `${rounded}${suffix}`;
}

export function describeAttendanceTrend(attendance: AttendanceTrend): string {
  if (attendance.sessionsHeld < 2) {
    return "Not enough sessions yet to show a trend.";
  }
  const direction =
    attendance.change > 0 ? "up" : attendance.change < 0 ? "down" : "flat";
  return `Attendance is ${direction}: ${attendance.earlierAverage} per session early in the period, ${attendance.laterAverage} later (${signed(attendance.change)}).`;
}

export function describeReasonShift(mix: ReasonMixShift): string {
  if (!mix.split) {
    return "Not enough check-ins yet to compare how reasons are shifting.";
  }
  const growth = mix.categories.find((c) => c.category === "Growth")!;
  const intervention = mix.categories.find(
    (c) => c.category === "Intervention",
  )!;
  return `Growth conversations moved from ${growth.earlierShare}% to ${growth.laterShare}% of reasons (${signed(growth.change, " pts")}), while intervention moved from ${intervention.earlierShare}% to ${intervention.laterShare}% (${signed(intervention.change, " pts")}).`;
}

export function buildImpactText(
  report: ImpactReport,
  settings: DebriefSettings,
): string {
  const name = settings.yourName.trim() || "Staff member";
  const role = settings.yourRole.trim();
  const school = settings.schoolName.trim();
  const groupName = settings.groupName.trim() || "Group";
  const { engagement, attendance, reasonMix, outcomes } = report;

  const lines = [
    "STUDENT IMPACT SUMMARY",
    report.range.label,
    `${report.range.start} through ${report.range.end}`,
    "",
  ];
  if (school) lines.push(`School: ${school}`);
  lines.push(`Prepared by: ${role ? `${name} (${role})` : name}`);
  lines.push("");

  lines.push("RETURNING STUDENTS");
  lines.push("------------------");
  lines.push(`Students seen: ${engagement.studentsSeen}`);
  lines.push(
    `Came back more than once: ${engagement.returning} (${engagement.returningShare}%)`,
  );
  lines.push(`Four or more check-ins: ${engagement.sustained}`);
  lines.push(`Average check-ins per student: ${engagement.averagePerStudent}`);

  if (engagement.students.length > 0) {
    lines.push("");
    for (const s of engagement.students.slice(0, 10)) {
      lines.push(
        `${s.name} (Grade ${s.grade}): ${s.checkIns} check-ins over ${s.weeksEngaged} weeks, ${s.firstSeen} to ${s.lastSeen}`,
      );
    }
  }

  lines.push("");
  lines.push(`${groupName.toUpperCase()} ATTENDANCE`);
  lines.push("-".repeat(groupName.length + 11));
  lines.push(`Sessions held: ${attendance.sessionsHeld}`);
  lines.push(`Average attendance: ${attendance.averageAttendance}`);
  lines.push(describeAttendanceTrend(attendance));
  if (attendance.monthly.length > 0) {
    lines.push("");
    for (const m of attendance.monthly) {
      lines.push(`${m.label}: ${m.average} per session across ${m.sessions}`);
    }
  }
  if (attendance.members.length > 0) {
    lines.push("");
    for (const m of attendance.members) {
      lines.push(`${m.name}: ${m.attended} of ${attendance.sessionsHeld} (${m.rate}%)`);
    }
  }

  lines.push("");
  lines.push("WHAT CHECK-INS ARE ABOUT");
  lines.push("------------------------");
  lines.push(describeReasonShift(reasonMix));
  if (reasonMix.split) {
    lines.push("");
    lines.push(`Earlier window: ${reasonMix.split.earlier.label}`);
    lines.push(`Later window: ${reasonMix.split.later.label}`);
    lines.push("");
    for (const c of reasonMix.categories) {
      lines.push(
        `${c.category}: ${c.earlierShare}% -> ${c.laterShare}% (${signed(c.change, " pts")})`,
      );
    }
  }

  lines.push("");
  lines.push("OUTCOMES");
  lines.push("--------");
  if (outcomes.recorded === 0) {
    lines.push(
      "No outcomes recorded yet. Tap an outcome when logging a check-in to build this section.",
    );
  } else {
    lines.push(
      `Recorded on ${outcomes.recorded} of ${outcomes.recorded + outcomes.missing} check-ins (${outcomes.recordedShare}%)`,
    );
    lines.push("");
    for (const o of outcomes.counts) {
      lines.push(`${o.outcome}: ${o.count} (${o.share}%)`);
    }
  }

  lines.push("");
  lines.push("---");
  lines.push(
    "Counts and trends only. Individual notes stay in the daily log and are not included here.",
  );

  return lines.join("\n");
}
