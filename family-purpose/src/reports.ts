import type { CheckIn, DebriefSettings, GroupSession } from "./types";

export type PeriodScope = "year" | "q1" | "q2" | "q3" | "q4";

export interface PeriodOption {
  scope: PeriodScope;
  label: string;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { scope: "year", label: "Full year" },
  { scope: "q1", label: "Q1 (Jan–Mar)" },
  { scope: "q2", label: "Q2 (Apr–Jun)" },
  { scope: "q3", label: "Q3 (Jul–Sep)" },
  { scope: "q4", label: "Q4 (Oct–Dec)" },
];

export interface DateRange {
  /** Inclusive first day, YYYY-MM-DD. */
  start: string;
  /** Inclusive last day, YYYY-MM-DD. */
  end: string;
  label: string;
}

export interface Tally {
  label: string;
  count: number;
}

export interface StudentTally extends Tally {
  grade: string;
}

export interface GroupSummary {
  sessions: number;
  totalAttendance: number;
  uniqueAttendees: number;
  averageAttendance: number;
  bestAttended: { date: string; topic: string; count: number } | null;
}

export interface PeriodReport {
  range: DateRange;
  totalCheckIns: number;
  uniqueStudents: number;
  byReason: Tally[];
  byGrade: Tally[];
  byMonth: Tally[];
  topStudents: StudentTally[];
  group: GroupSummary;
}

const QUARTER_MONTHS: Record<Exclude<PeriodScope, "year">, [number, number]> = {
  q1: [0, 2],
  q2: [3, 5],
  q3: [6, 8],
  q4: [9, 11],
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dayString(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Local calendar day for a timestamp, so evening entries stay on their date. */
export function dayKeyOf(iso: string): string {
  const d = new Date(iso);
  return dayString(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getRange(year: number, scope: PeriodScope): DateRange {
  if (scope === "year") {
    return {
      start: dayString(year, 0, 1),
      end: dayString(year, 11, 31),
      label: `Calendar year ${year}`,
    };
  }
  const [first, last] = QUARTER_MONTHS[scope];
  const option = PERIOD_OPTIONS.find((o) => o.scope === scope)!;
  return {
    start: dayString(year, first, 1),
    end: dayString(year, last, lastDayOfMonth(year, last)),
    label: `${option.label} ${year}`,
  };
}

function inRange(day: string, range: DateRange): boolean {
  return day >= range.start && day <= range.end;
}

function sortByCount(tallies: Tally[]): Tally[] {
  return tallies.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function monthLabel(day: string): string {
  const [year, month] = day.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

/** Years that have any data, newest first, always including the current one. */
export function availableYears(
  checkIns: CheckIn[],
  sessions: GroupSession[],
): number[] {
  const years = new Set<number>([new Date().getFullYear()]);
  for (const c of checkIns) years.add(Number(dayKeyOf(c.createdAt).slice(0, 4)));
  for (const s of sessions) years.add(Number(s.date.slice(0, 4)));
  return [...years].sort((a, b) => b - a);
}

export function buildPeriodReport(
  checkIns: CheckIn[],
  sessions: GroupSession[],
  range: DateRange,
): PeriodReport {
  const inPeriod = checkIns.filter((c) => inRange(dayKeyOf(c.createdAt), range));
  const sessionsInPeriod = sessions.filter((s) => inRange(s.date, range));

  const reasonCounts = new Map<string, number>();
  const gradeCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();
  const studentCounts = new Map<string, StudentTally>();

  for (const c of inPeriod) {
    for (const reason of c.reasons) {
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    }
    gradeCounts.set(c.grade, (gradeCounts.get(c.grade) ?? 0) + 1);

    const month = dayKeyOf(c.createdAt).slice(0, 7);
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);

    const key = c.studentName.trim().toLowerCase();
    const student = studentCounts.get(key);
    if (student) student.count += 1;
    else
      studentCounts.set(key, {
        label: c.studentName.trim(),
        grade: c.grade,
        count: 1,
      });
  }

  const attendanceCounts = sessionsInPeriod.map((s) => s.attendees.length);
  const totalAttendance = attendanceCounts.reduce((sum, n) => sum + n, 0);
  const uniqueAttendees = new Set(
    sessionsInPeriod.flatMap((s) =>
      s.attendees.map((a) => a.trim().toLowerCase()),
    ),
  ).size;

  const bestSession = sessionsInPeriod.reduce<GroupSession | null>(
    (best, s) =>
      !best || s.attendees.length > best.attendees.length ? s : best,
    null,
  );

  return {
    range,
    totalCheckIns: inPeriod.length,
    uniqueStudents: studentCounts.size,
    byReason: sortByCount(
      [...reasonCounts].map(([label, count]) => ({ label, count })),
    ),
    byGrade: [...gradeCounts]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => Number(a.label) - Number(b.label) || a.label.localeCompare(b.label)),
    byMonth: [...monthCounts]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ label: monthLabel(`${month}-01`), count })),
    topStudents: [...studentCounts.values()]
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 10),
    group: {
      sessions: sessionsInPeriod.length,
      totalAttendance,
      uniqueAttendees,
      averageAttendance: sessionsInPeriod.length
        ? Math.round((totalAttendance / sessionsInPeriod.length) * 10) / 10
        : 0,
      bestAttended:
        bestSession && bestSession.attendees.length > 0
          ? {
              date: bestSession.date,
              topic: bestSession.topic,
              count: bestSession.attendees.length,
            }
          : null,
    },
  };
}

function tallyLines(title: string, tallies: Tally[], total: number): string[] {
  if (tallies.length === 0) return [];
  const lines = ["", title, "-".repeat(title.length)];
  for (const t of tallies) {
    const share = total > 0 ? ` (${Math.round((t.count / total) * 100)}%)` : "";
    lines.push(`${t.label}: ${t.count}${share}`);
  }
  return lines;
}

export function buildReportText(
  report: PeriodReport,
  settings: DebriefSettings,
): string {
  const name = settings.yourName.trim() || "Staff member";
  const role = settings.yourRole.trim();
  const school = settings.schoolName.trim();
  const groupName = settings.groupName.trim() || "Group";

  const lines = [
    "STUDENT SUPPORT SUMMARY",
    report.range.label,
    `${report.range.start} through ${report.range.end}`,
    "",
  ];

  if (school) lines.push(`School: ${school}`);
  lines.push(`Prepared by: ${role ? `${name} (${role})` : name}`);
  lines.push("");
  lines.push("OVERVIEW");
  lines.push("--------");
  lines.push(`Total check-ins: ${report.totalCheckIns}`);
  lines.push(`Students served: ${report.uniqueStudents}`);
  lines.push(`${groupName} sessions: ${report.group.sessions}`);
  lines.push(`${groupName} members signed in: ${report.group.uniqueAttendees}`);
  lines.push(
    `${groupName} average attendance: ${report.group.averageAttendance}`,
  );

  if (report.totalCheckIns === 0 && report.group.sessions === 0) {
    lines.push("");
    lines.push("No check-ins or group sessions were recorded in this period.");
    return lines.join("\n");
  }

  lines.push(
    ...tallyLines("REASONS FOR CHECK-IN", report.byReason, report.totalCheckIns),
  );
  lines.push(...tallyLines("BY GRADE", report.byGrade, report.totalCheckIns));
  lines.push(...tallyLines("BY MONTH", report.byMonth, report.totalCheckIns));

  if (report.topStudents.length > 0) {
    lines.push("");
    lines.push("MOST FREQUENT CHECK-INS");
    lines.push("-----------------------");
    for (const s of report.topStudents) {
      lines.push(`${s.label} (Grade ${s.grade}): ${s.count}`);
    }
  }

  lines.push("");
  lines.push("---");
  lines.push(
    "Prepared for school leadership and program reporting. Individual notes stay in the daily log; this summary reports counts only.",
  );

  return lines.join("\n");
}
