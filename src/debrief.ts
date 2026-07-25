import type { CheckIn, DebriefSettings, GroupSession } from "./types";
import { getTodayDateLabel } from "./storage";

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

export function buildDebriefText(
  checkIns: CheckIn[],
  settings: DebriefSettings,
  session: GroupSession | null = null,
): string {
  const name = settings.yourName.trim() || "Staff member";
  const role = settings.yourRole.trim();
  const school = settings.schoolName.trim();
  const groupName = settings.groupName.trim() || "Group";
  const showSession = hasSessionContent(session);

  const lines = ["END OF DAY CHECK-IN DEBRIEF", getTodayDateLabel(), ""];

  if (school) lines.push(`School: ${school}`);
  lines.push(`Prepared by: ${role ? `${name} (${role})` : name}`);
  lines.push("");
  lines.push(`Total student check-ins today: ${checkIns.length}`);
  if (showSession) {
    lines.push(`${groupName} signed in today: ${session!.attendees.length}`);
  }
  lines.push("");

  if (checkIns.length === 0 && !showSession) {
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
      lines.push(`Student: ${c.studentName}`);
      lines.push(
        `Grade: ${c.grade}  |  Period: ${c.classPeriod}  |  Time: ${formatTime(c.createdAt)}`,
      );
      lines.push(`Reason(s): ${formatReasons(c)}`);
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
