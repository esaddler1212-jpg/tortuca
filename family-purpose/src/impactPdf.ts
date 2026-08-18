import type { DebriefSettings } from "./types";
import {
  describeAttendanceTrend,
  describeReasonShift,
  type ImpactReport,
} from "./impact";
import {
  createDoc,
  drawFooter,
  drawHeader,
  drawParagraph,
  drawTable,
  fileSlug,
} from "./pdfKit";

const FOOTER =
  "Counts and trends only — individual notes stay in the daily log and are not included here.";

function signed(value: number, suffix = ""): string {
  return value > 0 ? `+${value}${suffix}` : `${value}${suffix}`;
}

export function downloadImpactPdf(
  report: ImpactReport,
  settings: DebriefSettings,
): void {
  const doc = createDoc();
  const groupName = settings.groupName.trim() || "Group";
  const { engagement, attendance, reasonMix, outcomes } = report;
  let y = drawHeader(doc, "Student Impact Summary", report.range, settings);

  y = drawTable(
    doc,
    y,
    null,
    ["Measure", "Value"],
    [
      ["Students seen", String(engagement.studentsSeen)],
      [
        "Came back more than once",
        `${engagement.returning} (${engagement.returningShare}%)`,
      ],
      ["Four or more check-ins", String(engagement.sustained)],
      ["Average check-ins per student", String(engagement.averagePerStudent)],
      [`${groupName} sessions held`, String(attendance.sessionsHeld)],
      [`${groupName} average attendance`, String(attendance.averageAttendance)],
    ],
    { 1: { cellWidth: 120, halign: "right" } },
  );

  y = drawTable(
    doc,
    y,
    "Returning students",
    ["Student", "Grade", "Check-ins", "Weeks", "First", "Last"],
    engagement.students
      .slice(0, 15)
      .map((s) => [
        s.name,
        s.grade,
        String(s.checkIns),
        String(s.weeksEngaged),
        s.firstSeen,
        s.lastSeen,
      ]),
    {
      1: { cellWidth: 45, halign: "right" },
      2: { cellWidth: 60, halign: "right" },
      3: { cellWidth: 48, halign: "right" },
      4: { cellWidth: 70 },
      5: { cellWidth: 70 },
    },
  );

  y = drawParagraph(doc, y, describeAttendanceTrend(attendance));
  y = drawTable(
    doc,
    y,
    `${groupName} attendance by month`,
    ["Month", "Sessions", "Average attendance"],
    attendance.monthly.map((m) => [
      m.label,
      String(m.sessions),
      String(m.average),
    ]),
    {
      1: { cellWidth: 70, halign: "right" },
      2: { cellWidth: 130, halign: "right" },
    },
  );
  y = drawTable(
    doc,
    y,
    `${groupName} attendance by member`,
    ["Member", "Sessions attended", "Rate"],
    attendance.members.map((m) => [
      m.name,
      `${m.attended} of ${attendance.sessionsHeld}`,
      `${m.rate}%`,
    ]),
    {
      1: { cellWidth: 120, halign: "right" },
      2: { cellWidth: 60, halign: "right" },
    },
  );

  y = drawParagraph(doc, y, describeReasonShift(reasonMix));
  if (reasonMix.split) {
    y = drawTable(
      doc,
      y,
      "What check-ins are about",
      [
        "Category",
        `Earlier (${reasonMix.split.earlier.label})`,
        `Later (${reasonMix.split.later.label})`,
        "Change",
      ],
      reasonMix.categories.map((c) => [
        c.category,
        `${c.earlierShare}%`,
        `${c.laterShare}%`,
        signed(c.change, " pts"),
      ]),
      {
        1: { cellWidth: 130, halign: "right" },
        2: { cellWidth: 130, halign: "right" },
        3: { cellWidth: 60, halign: "right" },
      },
    );
  }

  if (outcomes.recorded > 0) {
    y = drawTable(
      doc,
      y,
      `Outcomes (recorded on ${outcomes.recordedShare}% of check-ins)`,
      ["Outcome", "Count", "Share"],
      outcomes.counts.map((o) => [o.outcome, String(o.count), `${o.share}%`]),
      {
        1: { cellWidth: 60, halign: "right" },
        2: { cellWidth: 60, halign: "right" },
      },
    );
  } else {
    drawParagraph(
      doc,
      y,
      "No outcomes recorded yet. Tap an outcome when logging a check-in to build this section.",
    );
  }

  drawFooter(doc, FOOTER);
  doc.save(`student-impact-summary-${fileSlug(report.range.label)}.pdf`);
}
