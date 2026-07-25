import type { CheckIn, DebriefSettings } from "./types";
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

export function buildDebriefText(
  checkIns: CheckIn[],
  settings: DebriefSettings,
): string {
  const dateLabel = getTodayDateLabel();
  const name = settings.yourName.trim() || "Staff member";
  const role = settings.yourRole.trim();
  const school = settings.schoolName.trim();

  const headerLines = [
    "END OF DAY CHECK-IN DEBRIEF",
    dateLabel,
    "",
  ];

  if (school) headerLines.push(`School: ${school}`);
  if (role) headerLines.push(`Prepared by: ${name} (${role})`);
  else headerLines.push(`Prepared by: ${name}`);
  headerLines.push("");
  headerLines.push(`Total student check-ins today: ${checkIns.length}`);
  headerLines.push("");

  if (checkIns.length === 0) {
    headerLines.push(
      "No student check-ins were logged for today. If check-ins occurred, please update the log and resend this debrief.",
    );
    return headerLines.join("\n");
  }

  headerLines.push("SUMMARY BY STUDENT");
  headerLines.push("------------------");

  const sorted = [...checkIns].sort((a, b) =>
    a.studentName.localeCompare(b.studentName),
  );

  for (const c of sorted) {
    headerLines.push("");
    headerLines.push(`Student: ${c.studentName}`);
    headerLines.push(`Grade: ${c.grade}  |  Period: ${c.classPeriod}  |  Time: ${formatTime(c.createdAt)}`);
    headerLines.push(`Reason(s): ${formatReasons(c)}`);
  }

  headerLines.push("");
  headerLines.push("---");
  headerLines.push(
    "This debrief documents same-day student check-ins for school staff and program reporting. Please reach out if any follow-up is needed.",
  );

  return headerLines.join("\n");
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
