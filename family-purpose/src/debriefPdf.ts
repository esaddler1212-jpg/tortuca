import type { CheckIn, DebriefSettings, GroupSession } from "./types";
import { getTodayDateLabel, todayKey } from "./storage";
import { hasSessionContent, outstandingFollowUps } from "./debrief";
import { scheduleNote } from "./schoolCalendar";
import { formatDueLabel, studentLabel } from "./followups";
import {
  createDoc,
  drawFooter,
  drawHeader,
  drawParagraph,
  drawTable,
} from "./pdfKit";

function formatReasons(checkIn: CheckIn): string {
  const parts: string[] = [...checkIn.reasons];
  if (checkIn.reasonNotes.trim()) parts.push(checkIn.reasonNotes.trim());
  return parts.join("; ") || "—";
}

function formatOutcome(checkIn: CheckIn): string {
  if (!checkIn.outcome) return "—";
  const detail = checkIn.outcomeNotes?.trim();
  return detail ? `${checkIn.outcome} — ${detail}` : checkIn.outcome;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function downloadDebriefPdf(
  checkIns: CheckIn[],
  settings: DebriefSettings,
  session: GroupSession | null = null,
  allCheckIns: CheckIn[] = checkIns,
): void {
  const doc = createDoc();
  const day = todayKey();
  const groupName = settings.groupName.trim() || "Group";
  const showSession = hasSessionContent(session);
  const followUps = outstandingFollowUps(checkIns, allCheckIns);

  let y = drawHeader(
    doc,
    "End of Day Check-In Debrief",
    { start: day, end: day, label: getTodayDateLabel() },
    settings,
  );

  const note = scheduleNote(day);
  if (note) y = drawParagraph(doc, y, note);

  const overview: string[][] = [
    ["Student check-ins today", String(checkIns.length)],
  ];
  if (showSession) {
    overview.push([
      `${groupName} signed in`,
      String(session!.attendees.length),
    ]);
  }
  if (followUps.length > 0) {
    overview.push(["Follow-ups outstanding", String(followUps.length)]);
  }
  y = drawTable(doc, y, null, ["Overview", "Value"], overview, {
    1: { cellWidth: 90, halign: "right" },
  });

  if (checkIns.length === 0 && !showSession && followUps.length === 0) {
    y = drawParagraph(
      doc,
      y,
      "No student check-ins were logged for today. If check-ins occurred, please update the log and regenerate this debrief.",
    );
  } else if (checkIns.length > 0) {
    const sorted = [...checkIns].sort((a, b) =>
      a.studentName.localeCompare(b.studentName),
    );
    y = drawTable(
      doc,
      y,
      "Summary by student",
      ["Student", "ID", "Grade", "Period", "Time", "Reason(s)", "Outcome"],
      sorted.map((c) => [
        c.studentName,
        c.studentId?.trim() || "—",
        c.grade,
        c.classPeriod,
        formatTime(c.createdAt),
        formatReasons(c),
        formatOutcome(c),
      ]),
      {
        0: { cellWidth: 80 },
        1: { cellWidth: 45 },
        2: { cellWidth: 36, halign: "right" },
        3: { cellWidth: 80 },
        4: { cellWidth: 45 },
        5: { cellWidth: "auto" },
        6: { cellWidth: 95 },
      },
    );
  }

  y = drawTable(
    doc,
    y,
    "Follow-ups",
    ["Student", "Due", "Recommended services", "CARE team"],
    followUps.map((c) => [
      studentLabel(c),
      formatDueLabel(c.followUp!),
      c.followUp!.services.join("; ") || "—",
      c.followUp!.careTeamReferral ? "Referred" : "—",
    ]),
    {
      1: { cellWidth: 110 },
      3: { cellWidth: 70 },
    },
  );

  if (showSession) {
    const s = session!;
    const rows: string[][] = [];
    if (s.topic.trim()) rows.push(["Focus", s.topic.trim()]);
    rows.push([
      `Signed in (${s.attendees.length})`,
      s.attendees.join(", ") || "—",
    ]);
    if (s.notes.trim()) rows.push(["Notes", s.notes.trim()]);
    drawTable(doc, y, `${groupName} session`, ["Field", "Detail"], rows, {
      0: { cellWidth: 130, fontStyle: "bold" },
    });
  }

  drawFooter(
    doc,
    "Same-day student check-ins for school staff and program reporting. CARE team detail is shared separately.",
  );
  doc.save(`check-in-debrief-${day}.pdf`);
}
