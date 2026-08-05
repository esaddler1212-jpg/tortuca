/** Build Family Purpose woodhouse/v2 node from a Family Purpose backup export. */

const FOLLOW_UP_WINDOW_HOURS = 48;

export interface FpFollowUp {
  dueAt: string;
  completedAt?: string;
  notes: string;
}

export interface FpCheckIn {
  id: string;
  studentName: string;
  grade: string;
  classPeriod: string;
  reasons: string[];
  followUp?: FpFollowUp;
  createdAt: string;
}

export interface FpGroupSession {
  id: string;
  date: string;
  topic: string;
  notes: string;
  attendees: string[];
  updatedAt: string;
}

export interface FpBackup {
  settings?: {
    schoolName?: string;
    groupName?: string;
    yourName?: string;
  };
  checkIns: FpCheckIn[];
  groupSessions?: FpGroupSession[];
}

export interface FpWoodhouseNode {
  nodeId: string;
  appName: string;
  schoolName: string;
  groupName: string;
  day: string;
  schoolDay: { isSchoolDay: boolean; label: string };
  stats: {
    checkInsToday: number;
    followUpsDueToday: number;
    followUpsOverdue: number;
    groupMeetingsToday: number;
  };
  calendar: Array<{
    id: string;
    kind: "group_meeting" | "follow_up_due" | "follow_up_overdue" | "check_in_today" | "school_day";
    title: string;
    start: string;
    end?: string;
    detail?: string;
  }>;
  priorityActions: string[];
}

function dayKey(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
}

function dayKeyOfIso(iso: string, timeZone: string): string {
  return dayKey(new Date(iso), timeZone);
}

function startOfLocalDay(day: string, timeZone: string): string {
  return new Date(`${day}T12:00:00`).toISOString();
}

function schoolDayInfo(day: string, timeZone: string): { isSchoolDay: boolean; label: string } {
  const [y, m, d] = day.split("-").map(Number);
  const noon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(noon);
  const isWeekend = weekday === "Sat" || weekday === "Sun";
  if (isWeekend) {
    return { isSchoolDay: false, label: "No school — weekend" };
  }
  return { isSchoolDay: true, label: "School day" };
}

type FollowState = "overdue" | "dueToday" | "upcoming" | "done";

function followState(followUp: FpFollowUp, now: Date, timeZone: string): FollowState {
  if (followUp.completedAt) return "done";
  if (Date.parse(followUp.dueAt) <= now.getTime()) return "overdue";
  return dayKeyOfIso(followUp.dueAt, timeZone) === dayKey(now, timeZone) ? "dueToday" : "upcoming";
}

export function buildFamilyPurposeWoodhouseNode(
  backup: FpBackup,
  now = new Date(),
  timeZone = "America/Los_Angeles",
): FpWoodhouseNode {
  const day = dayKey(now, timeZone);
  const school = schoolDayInfo(day, timeZone);
  const schoolName = backup.settings?.schoolName?.trim() || "Oak Grove Middle School";
  const groupName = backup.settings?.groupName?.trim() || "BOYS Group";

  const checkIns = backup.checkIns ?? [];
  const sessions = backup.groupSessions ?? [];

  const todayCheckIns = checkIns.filter((c) => dayKeyOfIso(c.createdAt, timeZone) === day);
  const openFollowUps = checkIns.filter((c) => c.followUp && !c.followUp.completedAt);

  let followUpsDueToday = 0;
  let followUpsOverdue = 0;
  const calendar: FpWoodhouseNode["calendar"] = [];

  calendar.push({
    id: `school-${day}`,
    kind: "school_day",
    title: school.label,
    start: startOfLocalDay(day, timeZone),
    detail: schoolName,
  });

  for (const session of sessions.filter((s) => s.date === day)) {
    calendar.push({
      id: `group-${session.id}`,
      kind: "group_meeting",
      title: `${groupName} meeting`,
      start: startOfLocalDay(day, timeZone),
      detail: session.topic?.trim()
        ? `${session.topic} · ${session.attendees.length} signed in`
        : `${session.attendees.length} attendees`,
    });
  }

  for (const c of openFollowUps) {
    const fu = c.followUp!;
    const state = followState(fu, now, timeZone);
    if (state === "dueToday") followUpsDueToday += 1;
    if (state === "overdue") followUpsOverdue += 1;
    if (state === "dueToday" || state === "overdue") {
      calendar.push({
        id: `followup-${c.id}`,
        kind: state === "overdue" ? "follow_up_overdue" : "follow_up_due",
        title: `Follow up: ${c.studentName}`,
        start: fu.dueAt,
        detail: c.reasons?.slice(0, 2).join(", ") || c.classPeriod,
      });
    }
  }

  for (const c of todayCheckIns.slice(0, 8)) {
    calendar.push({
      id: `checkin-${c.id}`,
      kind: "check_in_today",
      title: `Check-in: ${c.studentName}`,
      start: c.createdAt,
      detail: `${c.classPeriod} · ${c.reasons?.[0] ?? "Logged"}`,
    });
  }

  calendar.sort((a, b) => a.start.localeCompare(b.start));

  const priorityActions: string[] = [];
  if (followUpsOverdue > 0) {
    priorityActions.push(
      `${followUpsOverdue} overdue student follow-up${followUpsOverdue === 1 ? "" : "s"} in Family Purpose`,
    );
  }
  if (followUpsDueToday > 0) {
    priorityActions.push(
      `${followUpsDueToday} follow-up${followUpsDueToday === 1 ? "" : "s"} due today`,
    );
  }
  const meetingsToday = sessions.filter((s) => s.date === day).length;
  if (meetingsToday === 0 && school.isSchoolDay) {
    priorityActions.push(`Log ${groupName} sign-in if you meet today`);
  }

  return {
    nodeId: "family-purpose",
    appName: "Family Purpose",
    schoolName,
    groupName,
    day,
    schoolDay: school,
    stats: {
      checkInsToday: todayCheckIns.length,
      followUpsDueToday,
      followUpsOverdue,
      groupMeetingsToday: meetingsToday,
    },
    calendar,
    priorityActions,
  };
}

export function demoFamilyPurposeNode(now = new Date()): FpWoodhouseNode {
  const day = dayKey(now, "America/Los_Angeles");
  return {
    nodeId: "family-purpose-demo",
    appName: "Family Purpose",
    schoolName: "Oak Grove Middle School",
    groupName: "BOYS Group",
    day,
    schoolDay: schoolDayInfo(day, "America/Los_Angeles"),
    stats: {
      checkInsToday: 3,
      followUpsDueToday: 1,
      followUpsOverdue: 0,
      groupMeetingsToday: 1,
    },
    calendar: [
      {
        id: "school-demo",
        kind: "school_day",
        title: "School day",
        start: startOfLocalDay(day, "America/Los_Angeles"),
        detail: "Oak Grove Middle School",
      },
      {
        id: "group-demo",
        kind: "group_meeting",
        title: "BOYS Group meeting",
        start: startOfLocalDay(day, "America/Los_Angeles"),
        detail: "Weekly check-in · plan for 12:30",
      },
      {
        id: "follow-demo",
        kind: "follow_up_due",
        title: "Follow up: Andre Bell",
        start: new Date(now.getTime() + 2 * 3_600_000).toISOString(),
        detail: "Attendance / tardiness",
      },
    ],
    priorityActions: ["1 follow-up due today", "Log BOYS Group sign-in if you meet today"],
  };
}
