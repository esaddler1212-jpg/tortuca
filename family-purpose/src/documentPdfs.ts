import type { CheckIn, DebriefSettings } from "./types";
import { formatDayLabel } from "./storage";
import { dayKeyOf } from "./reports";
import { careTeamReferrals, formatDueLabel, studentLabel } from "./followups";
import {
  buildAttendanceRows,
  type WeeklySummary,
} from "./documents";
import {
  createDoc,
  drawFooter,
  drawHeader,
  drawParagraph,
  drawTable,
  fileSlug,
} from "./pdfKit";

export function downloadAttendanceListPdf(
  checkIns: CheckIn[],
  day: string,
  settings: DebriefSettings,
): void {
  const doc = createDoc();
  const rows = buildAttendanceRows(checkIns, day);
  const range = { start: day, end: day, label: formatDayLabel(day) };

  let y = drawHeader(doc, "Student Check-In List", range, settings);
  y = drawParagraph(
    doc,
    y,
    rows.length === 0
      ? "No students checked in on this day."
      : `${rows.length} student check-in${rows.length === 1 ? "" : "s"}. Time shown is when the student checked in; class period is the class they came from.`,
  );

  drawTable(
    doc,
    y,
    null,
    ["Time", "Student", "ID", "Grade", "Class period"],
    rows.map((r) => [r.time, r.name, r.studentId, r.grade, r.classPeriod]),
    {
      0: { cellWidth: 65 },
      2: { cellWidth: 70 },
      3: { cellWidth: 50, halign: "right" },
      4: { cellWidth: 150 },
    },
  );

  drawFooter(doc, "Prepared for the attendance clerk.");
  doc.save(`check-in-list-${day}.pdf`);
}

export function downloadWeeklySummaryPdf(
  summary: WeeklySummary,
  settings: DebriefSettings,
): void {
  const doc = createDoc();
  const groupName = settings.groupName.trim() || "Group";
  const range = {
    start: summary.week.start,
    end: summary.week.end,
    label: summary.week.label,
  };

  let y = drawHeader(doc, "Weekly Check-In Summary", range, settings);

  y = drawTable(
    doc,
    y,
    null,
    ["Measure", "Value"],
    [
      ["Check-ins", String(summary.totalCheckIns)],
      ["Students seen", String(summary.uniqueStudents)],
      ["Days with check-ins", String(summary.days.length)],
      ["Follow-ups still open", String(summary.openFollowUps.length)],
      ["CARE team referrals", String(summary.referrals.length)],
    ],
    { 1: { cellWidth: 90, halign: "right" } },
  );

  y = drawTable(
    doc,
    y,
    "Who we checked in with",
    ["Day", "Students", "Check-ins"],
    summary.days.map((d) => [
      d.label,
      d.students.join(", "),
      String(d.checkIns),
    ]),
    {
      0: { cellWidth: 130 },
      2: { cellWidth: 70, halign: "right" },
    },
  );

  y = drawTable(
    doc,
    y,
    "Seen more than once",
    ["Student", "Check-ins"],
    summary.repeatStudents.map((s) => [s.name, String(s.count)]),
    { 1: { cellWidth: 80, halign: "right" } },
  );

  y = drawTable(
    doc,
    y,
    `${groupName} sessions`,
    ["Day", "Focus", "Signed in"],
    summary.sessions.map((s) => [
      s.date,
      s.topic.trim() || "—",
      String(s.attendees.length),
    ]),
    {
      0: { cellWidth: 90 },
      2: { cellWidth: 70, halign: "right" },
    },
  );

  drawTable(
    doc,
    y,
    "Still open",
    ["Student", "Follow-up"],
    summary.openFollowUps.map((c) => [
      studentLabel(c),
      formatDueLabel(c.followUp!),
    ]),
    { 1: { cellWidth: 170 } },
  );

  drawFooter(
    doc,
    "Counts and names only — conversation notes stay in the daily log.",
  );
  doc.save(`weekly-summary-${summary.week.start}.pdf`);
}

export function downloadCareTeamPdf(
  checkIns: CheckIn[],
  range: { start: string; end: string; label: string },
  settings: DebriefSettings,
): void {
  const doc = createDoc();
  const referrals = careTeamReferrals(
    checkIns.filter((c) => {
      const day = dayKeyOf(c.createdAt);
      return day >= range.start && day <= range.end;
    }),
  );

  let y = drawHeader(doc, "CARE Team Referrals", range, settings);
  y = drawParagraph(
    doc,
    y,
    "CONFIDENTIAL — for CARE team review only. Contains student support detail.",
  );

  if (referrals.length === 0) {
    drawParagraph(doc, y, "No CARE team referrals in this window.");
  } else {
    for (const c of referrals) {
      const followUp = c.followUp!;
      const rows: string[][] = [
        ["Grade / period", `${c.grade} · ${c.classPeriod}`],
        ["Checked in", formatDayLabel(dayKeyOf(c.createdAt))],
        ["Reason(s)", c.reasons.join("; ") || "—"],
      ];
      if (c.reasonNotes.trim()) rows.push(["Context", c.reasonNotes.trim()]);
      if (c.outcome) rows.push(["Outcome", c.outcome]);
      if (c.outcomeNotes?.trim()) {
        rows.push(["What happened", c.outcomeNotes.trim()]);
      }
      rows.push([
        "Recommended services",
        followUp.services.join("; ") || "None recorded",
      ]);
      if (followUp.notes.trim()) {
        rows.push(["Follow-up notes", followUp.notes.trim()]);
      }
      rows.push(["Follow-up status", formatDueLabel(followUp)]);

      y = drawTable(doc, y, studentLabel(c), ["Field", "Detail"], rows, {
        0: { cellWidth: 130, fontStyle: "bold" },
      });
    }
  }

  drawFooter(doc, "CONFIDENTIAL — share only within the CARE team.");
  doc.save(`care-team-referrals-${fileSlug(range.label)}.pdf`);
}
