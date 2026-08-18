import type { CheckIn, DebriefSettings, GroupSession } from "./types";
import { getTodayDateLabel, todayKey } from "./storage";
import { scheduleNote } from "./schoolCalendar";
import { formatDueLabel, studentLabel } from "./followups";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatReasons(checkIn: CheckIn): string {
  const parts: string[] = [...checkIn.reasons];
  if (checkIn.reasonNotes.trim()) {
    parts.push(`Notes: ${checkIn.reasonNotes.trim()}`);
  }
  return parts.join("; ");
}

export function hasSessionContent(session: GroupSession | null): boolean {
  if (!session) return false;
  return (
    session.attendees.length > 0 ||
    session.topic.trim().length > 0 ||
    session.notes.trim().length > 0
  );
}

/** Follow-ups raised today plus anything still owed from earlier check-ins. */
export function outstandingFollowUps(
  todayCheckIns: CheckIn[],
  allCheckIns: CheckIn[] = todayCheckIns,
): CheckIn[] {
  const todayIds = new Set(todayCheckIns.map((c) => c.id));
  return allCheckIns
    .filter((c) => c.followUp && !c.followUp.completedAt)
    .sort((a, b) => {
      // Today's new commitments lead, then the oldest deadlines.
      const aToday = todayIds.has(a.id) ? 0 : 1;
      const bToday = todayIds.has(b.id) ? 0 : 1;
      return (
        aToday - bToday || a.followUp!.dueAt.localeCompare(b.followUp!.dueAt)
      );
    });
}

export function buildDebriefText(
  checkIns: CheckIn[],
  settings: DebriefSettings,
  session: GroupSession | null = null,
  allCheckIns: CheckIn[] = checkIns,
): string {
  const name = settings.yourName.trim() || "Staff member";
  const role = settings.yourRole.trim();
  const school = settings.schoolName.trim();
  const groupName = settings.groupName.trim() || "Group";
  const showSession = hasSessionContent(session);
  const followUps = outstandingFollowUps(checkIns, allCheckIns);
  const referrals = followUps.filter((c) => c.followUp!.careTeamReferral);

  const lines = ["END OF DAY CHECK-IN DEBRIEF", getTodayDateLabel()];

  const note = scheduleNote(todayKey());
  if (note) lines.push(note);
  lines.push("");

  if (school) lines.push(`School: ${school}`);
  lines.push(`Prepared by: ${role ? `${name} (${role})` : name}`);
  lines.push("");
  lines.push(`Total student check-ins today: ${checkIns.length}`);
  if (showSession) {
    lines.push(`${groupName} signed in today: ${session!.attendees.length}`);
  }
  if (followUps.length > 0) {
    lines.push(`Follow-ups outstanding: ${followUps.length}`);
  }
  lines.push("");

  if (checkIns.length === 0 && !showSession && followUps.length === 0) {
    lines.push(
      "No student check-ins were logged for today. If check-ins occurred, please update the log and resend this debrief.",
    );
    return lines.join("\n");
  }

  if (checkIns.length > 0) {
    lines.push("SUMMARY BY STUDENT");
    lines.push("------------------");

    const sorted = [...checkIns].sort((a, b) =>
      a.studentName.localeCompare(b.studentName),
    );

    for (const c of sorted) {
      lines.push("");
      lines.push(`Student: ${studentLabel(c)}`);
      lines.push(
        `Grade: ${c.grade}  |  Period: ${c.classPeriod}  |  Time: ${formatTime(c.createdAt)}`,
      );
      lines.push(`Reason(s): ${formatReasons(c)}`);
      if (c.outcome) {
        const detail = c.outcomeNotes?.trim();
        lines.push(`Outcome: ${c.outcome}${detail ? ` — ${detail}` : ""}`);
      }
    }
    lines.push("");
  }

  if (followUps.length > 0) {
    lines.push("FOLLOW-UPS");
    lines.push("----------");
    for (const c of followUps) {
      const f = c.followUp!;
      lines.push("");
      lines.push(`${studentLabel(c)} — ${formatDueLabel(f)}`);
      if (f.services.length > 0) {
        lines.push(`  Recommended: ${f.services.join("; ")}`);
      }
      if (f.careTeamReferral) lines.push("  Referred to the CARE team");
    }
    lines.push("");
  }

  if (showSession) {
    const s = session!;
    lines.push(`${groupName.toUpperCase()} SESSION`);
    lines.push("-".repeat(groupName.length + 8));
    if (s.topic.trim()) lines.push(`Focus: ${s.topic.trim()}`);
    lines.push(`Signed in (${s.attendees.length}): ${s.attendees.join(", ") || "—"}`);
    if (s.notes.trim()) lines.push(`Notes: ${s.notes.trim()}`);
    lines.push("");
  }

  lines.push("---");
  lines.push(
    "This debrief documents same-day student check-ins for school staff and program reporting. Please reach out if any follow-up is needed.",
  );
  if (referrals.length > 0) {
    lines.push(
      `${referrals.length} student${referrals.length === 1 ? "" : "s"} referred to the CARE team. Detail is in the separate CARE team debrief, shared only with that team.`,
    );
  }

  return lines.join("\n");
}

export function buildMailtoUrl(
  recipients: string[],
  subject: string,
  body: string,
): string {
  const to = recipients.filter((e) => e.trim()).join(",");
  const params = new URLSearchParams();
  if (to) params.set("to", to);
  params.set("subject", subject);
  params.set("body", body);
  return `mailto:?${params.toString()}`;
}
