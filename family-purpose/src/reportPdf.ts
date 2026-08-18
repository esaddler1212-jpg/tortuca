import type { DebriefSettings } from "./types";
import type { PeriodReport, Tally } from "./reports";
import {
  createDoc,
  drawFooter,
  drawHeader,
  drawTable,
  fileSlug,
} from "./pdfKit";

const FOOTER =
  "Prepared for school leadership and program reporting. Counts only — individual notes stay in the daily log.";

function share(count: number, total: number): string {
  return total > 0 ? `${Math.round((count / total) * 100)}%` : "—";
}

function tallyRows(tallies: Tally[], total: number): string[][] {
  return tallies.map((t) => [t.label, String(t.count), share(t.count, total)]);
}

const COUNT_COLUMNS = {
  0: { cellWidth: "auto" as const },
  1: { cellWidth: 60, halign: "right" as const },
  2: { cellWidth: 60, halign: "right" as const },
};

export function downloadReportPdf(
  report: PeriodReport,
  settings: DebriefSettings,
): void {
  const doc = createDoc();
  const groupName = settings.groupName.trim() || "Group";
  let y = drawHeader(doc, "Student Support Summary", report.range, settings);

  y = drawTable(
    doc,
    y,
    null,
    ["Overview", "Value"],
    [
      ["Total check-ins", String(report.totalCheckIns)],
      ["Students served", String(report.uniqueStudents)],
      [`${groupName} sessions`, String(report.group.sessions)],
      [`${groupName} members signed in`, String(report.group.uniqueAttendees)],
      [
        `${groupName} average attendance`,
        String(report.group.averageAttendance),
      ],
    ],
    { 1: { cellWidth: 90, halign: "right" } },
  );

  y = drawTable(
    doc,
    y,
    "Reasons for check-in",
    ["Reason", "Count", "Share"],
    tallyRows(report.byReason, report.totalCheckIns),
    COUNT_COLUMNS,
  );
  y = drawTable(
    doc,
    y,
    "By grade",
    ["Grade", "Count", "Share"],
    tallyRows(report.byGrade, report.totalCheckIns),
    COUNT_COLUMNS,
  );
  y = drawTable(
    doc,
    y,
    "By month",
    ["Month", "Count", "Share"],
    tallyRows(report.byMonth, report.totalCheckIns),
    COUNT_COLUMNS,
  );
  drawTable(
    doc,
    y,
    "Most frequent check-ins",
    ["Student", "Grade", "Check-ins"],
    report.topStudents.map((s) => [s.label, s.grade, String(s.count)]),
    {
      1: { cellWidth: 60, halign: "right" },
      2: { cellWidth: 80, halign: "right" },
    },
  );

  drawFooter(doc, FOOTER);
  doc.save(`student-support-summary-${fileSlug(report.range.label)}.pdf`);
}
