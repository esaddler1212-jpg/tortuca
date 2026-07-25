import type { CheckIn, DebriefSettings, GroupSession } from "./types";
import { formatDayLabel } from "./storage";
import { dayKeyOf } from "./reports";
import {
  careTeamReferrals,
  formatDueLabel,
  studentLabel,
} from "./followups";

export interface WeekRange {
  /** Monday, YYYY-MM-DD. */
  start: string;
  /** Sunday, YYYY-MM-DD. */
  end: string;
  label: string;
}

function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDay(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
}

function shortDay(day: string): string {
  return parseDay(day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** The Monday-to-Sunday week containing the given day, offset by whole weeks. */
export function weekRange(day: string, weeksBack = 0): WeekRange {
  const date = parseDay(day);
  // getDay() is 0 on Sunday, which belongs to the week that started six days back.
  const mondayOffset = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - mondayOffset - weeksBack * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const start = toDayKey(monday);
  const end = toDayKey(sunday);
  return {
    start,
    end,
    label: `Week of ${parseDay(start).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
    })} – ${parseDay(end).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`,
  };
}

export function checkInsOnDay(checkIns: CheckIn[], day: string): CheckIn[] {
  return checkIns
    .filter((c) => dayKeyOf(c.createdAt) === day)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function checkInsInWeek(
  checkIns: CheckIn[],
  week: WeekRange,
): CheckIn[] {
  return checkIns
    .filter((c) => {
      const day = dayKeyOf(c.createdAt);
      return day >= week.start && day <= week.end;
    })
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function preparedBy(settings: DebriefSettings): string {
  const name = settings.yourName.trim() || "Staff member";
  const role = settings.yourRole.trim();
  return role ? `${name} (${role})` : name;
}

export interface AttendanceRow {
  time: string;
  name: string;
  studentId: string;
  grade: string;
  classPeriod: string;
}

/** One row per check-in, in the order students arrived. */
export function buildAttendanceRows(
  checkIns: CheckIn[],
  day: string,
): AttendanceRow[] {
  return checkInsOnDay(checkIns, day).map((c) => ({
    time: formatTime(c.createdAt),
    name: c.studentName,
    studentId: c.studentId?.trim() || "—",
    grade: c.grade,
    classPeriod: c.classPeriod,
  }));
}

export function buildAttendanceListText(
  checkIns: CheckIn[],
  day: string,
  settings: DebriefSettings,
): string {
  const rows = buildAttendanceRows(checkIns, day);
  const lines = ["STUDENT CHECK-IN LIST — ATTENDANCE CLERK", formatDayLabel(day), ""];
  if (settings.schoolName.trim()) lines.push(`School: ${settings.schoolName.trim()}`);
  lines.push(`Prepared by: ${preparedBy(settings)}`);
  lines.push("");

  if (rows.length === 0) {
    lines.push("No students checked in on this day.");
    return lines.join("\n");
  }

  lines.push(`Students seen: ${rows.length}`);
  lines.push("");
  for (const row of rows) {
    lines.push(
      `${row.time}  |  ${row.name}  |  ID ${row.studentId}  |  Grade ${row.grade}  |  ${row.classPeriod}`,
    );
  }
  lines.push("");
  lines.push("---");
  lines.push(
    "Time shown is when the student checked in. Class period is the class they came from.",
  );
  return lines.join("\n");
}

export interface WeeklyDay {
  day: string;
  label: string;
  students: string[];
  checkIns: number;
}

export interface WeeklySummary {
  week: WeekRange;
  days: WeeklyDay[];
  totalCheckIns: number;
  uniqueStudents: number;
  repeatStudents: { name: string; count: number }[];
  sessions: GroupSession[];
  openFollowUps: CheckIn[];
  referrals: CheckIn[];
}

export function buildWeeklySummary(
  checkIns: CheckIn[],
  sessions: GroupSession[],
  week: WeekRange,
): WeeklySummary {
  const inWeek = checkInsInWeek(checkIns, week);

  const byDay = new Map<string, CheckIn[]>();
  for (const c of inWeek) {
    const day = dayKeyOf(c.createdAt);
    byDay.set(day, [...(byDay.get(day) ?? []), c]);
  }

  const counts = new Map<string, { name: string; count: number }>();
  for (const c of inWeek) {
    const key = c.studentName.trim().toLowerCase();
    const entry = counts.get(key) ?? { name: c.studentName.trim(), count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }

  return {
    week,
    days: [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, entries]) => ({
        day,
        label: shortDay(day),
        students: entries.map(studentLabel),
        checkIns: entries.length,
      })),
    totalCheckIns: inWeek.length,
    uniqueStudents: counts.size,
    repeatStudents: [...counts.values()]
      .filter((s) => s.count > 1)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    sessions: sessions
      .filter((s) => s.date >= week.start && s.date <= week.end)
      .sort((a, b) => a.date.localeCompare(b.date)),
    openFollowUps: inWeek.filter(
      (c) => c.followUp && !c.followUp.completedAt,
    ),
    referrals: careTeamReferrals(inWeek),
  };
}

export function buildWeeklySummaryText(
  summary: WeeklySummary,
  settings: DebriefSettings,
): string {
  const groupName = settings.groupName.trim() || "Group";
  const lines = ["WEEKLY CHECK-IN SUMMARY", summary.week.label, ""];
  if (settings.schoolName.trim()) lines.push(`School: ${settings.schoolName.trim()}`);
  lines.push(`Prepared by: ${preparedBy(settings)}`);
  lines.push("");

  if (summary.totalCheckIns === 0 && summary.sessions.length === 0) {
    lines.push("No check-ins or group sessions were logged this week.");
    return lines.join("\n");
  }

  lines.push(`Check-ins: ${summary.totalCheckIns}`);
  lines.push(`Students seen: ${summary.uniqueStudents}`);
  lines.push(`Days with check-ins: ${summary.days.length}`);
  if (summary.openFollowUps.length > 0) {
    lines.push(`Follow-ups still open: ${summary.openFollowUps.length}`);
  }
  if (summary.referrals.length > 0) {
    lines.push(`CARE team referrals: ${summary.referrals.length}`);
  }
  lines.push("");

  if (summary.days.length > 0) {
    lines.push("WHO WE CHECKED IN WITH");
    lines.push("----------------------");
    for (const day of summary.days) {
      lines.push("");
      lines.push(`${day.label} (${day.checkIns})`);
      for (const student of day.students) lines.push(`  ${student}`);
    }
    lines.push("");
  }

  if (summary.repeatStudents.length > 0) {
    lines.push("SEEN MORE THAN ONCE");
    lines.push("-------------------");
    for (const s of summary.repeatStudents) {
      lines.push(`${s.name}: ${s.count} check-ins`);
    }
    lines.push("");
  }

  if (summary.sessions.length > 0) {
    lines.push(`${groupName.toUpperCase()} SESSIONS`);
    lines.push("-".repeat(groupName.length + 9));
    for (const s of summary.sessions) {
      const topic = s.topic.trim() ? ` — ${s.topic.trim()}` : "";
      lines.push(
        `${shortDay(s.date)}${topic}: ${s.attendees.length} signed in`,
      );
    }
    lines.push("");
  }

  if (summary.openFollowUps.length > 0) {
    lines.push("STILL OPEN");
    lines.push("----------");
    for (const c of summary.openFollowUps) {
      lines.push(`${studentLabel(c)} — ${formatDueLabel(c.followUp!)}`);
    }
    lines.push("");
  }

  lines.push("---");
  lines.push(
    "Counts and names only. Conversation notes stay in the daily log.",
  );
  return lines.join("\n");
}

export function buildCareTeamText(
  checkIns: CheckIn[],
  range: { start: string; end: string; label: string },
  settings: DebriefSettings,
): string {
  const referrals = careTeamReferrals(
    checkIns.filter((c) => {
      const day = dayKeyOf(c.createdAt);
      return day >= range.start && day <= range.end;
    }),
  );

  const lines = ["CARE TEAM REFERRALS", range.label, ""];
  if (settings.schoolName.trim()) lines.push(`School: ${settings.schoolName.trim()}`);
  lines.push(`Referred by: ${preparedBy(settings)}`);
  lines.push("");
  lines.push(
    "CONFIDENTIAL — for CARE team review only. Contains student support detail.",
  );
  lines.push("");

  if (referrals.length === 0) {
    lines.push("No CARE team referrals in this window.");
    return lines.join("\n");
  }

  lines.push(`Students referred: ${referrals.length}`);
  lines.push("");

  for (const c of referrals) {
    const followUp = c.followUp!;
    lines.push("========================================");
    lines.push(studentLabel(c));
    lines.push(
      `Grade ${c.grade}  |  ${c.classPeriod}  |  Checked in ${formatDayLabel(dayKeyOf(c.createdAt))}`,
    );
    lines.push("");
    if (c.reasons.length > 0) lines.push(`Reason(s): ${c.reasons.join("; ")}`);
    if (c.reasonNotes.trim()) lines.push(`Context: ${c.reasonNotes.trim()}`);
    if (c.outcome) lines.push(`Outcome: ${c.outcome}`);
    if (c.outcomeNotes?.trim()) lines.push(`What happened: ${c.outcomeNotes.trim()}`);
    lines.push(
      `Recommended services: ${followUp.services.length > 0 ? followUp.services.join("; ") : "None recorded"}`,
    );
    if (followUp.notes.trim()) lines.push(`Follow-up notes: ${followUp.notes.trim()}`);
    lines.push(`Follow-up status: ${formatDueLabel(followUp)}`);
    lines.push("");
  }

  lines.push("---");
  lines.push(
    "Share only within the CARE team. Each student above was referred after a documented check-in.",
  );
  return lines.join("\n");
}
