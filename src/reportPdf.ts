import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DebriefSettings } from "./types";
import type { PeriodReport, Tally } from "./reports";

const MARGIN = 40;
const HEAD_FILL: [number, number, number] = [36, 58, 88];

function share(count: number, total: number): string {
  return total > 0 ? `${Math.round((count / total) * 100)}%` : "—";
}

function tallyTable(
  doc: jsPDF,
  startY: number,
  title: string,
  columnName: string,
  tallies: Tally[],
  total: number,
): number {
  if (tallies.length === 0) return startY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 28, 40);
  doc.text(title, MARGIN, startY);

  autoTable(doc, {
    startY: startY + 8,
    head: [[columnName, "Count", "Share"]],
    body: tallies.map((t) => [t.label, String(t.count), share(t.count, total)]),
    styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
    headStyles: { fillColor: HEAD_FILL, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: MARGIN, right: MARGIN },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 60, halign: "right" },
      2: { cellWidth: 60, halign: "right" },
    },
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 24;
}

export function downloadReportPdf(
  report: PeriodReport,
  settings: DebriefSettings,
): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  const groupName = settings.groupName.trim() || "Group";
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 28, 40);
  doc.text("Student Support Summary", MARGIN, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 48, 60);
  doc.text(report.range.label, MARGIN, y);
  y += 15;

  doc.setFontSize(9);
  doc.setTextColor(110, 120, 135);
  doc.text(`${report.range.start} through ${report.range.end}`, MARGIN, y);
  y += 18;

  doc.setFontSize(11);
  doc.setTextColor(40, 48, 60);
  const name = settings.yourName.trim() || "Staff member";
  const role = settings.yourRole.trim();
  if (settings.schoolName.trim()) {
    doc.text(`School: ${settings.schoolName.trim()}`, MARGIN, y);
    y += 14;
  }
  doc.text(`Prepared by: ${role ? `${name} (${role})` : name}`, MARGIN, y);
  y += 24;

  autoTable(doc, {
    startY: y,
    head: [["Overview", "Value"]],
    body: [
      ["Total check-ins", String(report.totalCheckIns)],
      ["Students served", String(report.uniqueStudents)],
      [`${groupName} sessions`, String(report.group.sessions)],
      [`${groupName} members signed in`, String(report.group.uniqueAttendees)],
      [
        `${groupName} average attendance`,
        String(report.group.averageAttendance),
      ],
    ],
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: HEAD_FILL, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: MARGIN, right: MARGIN },
    columnStyles: { 1: { cellWidth: 90, halign: "right" } },
  });
  y =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 24;

  y = tallyTable(
    doc,
    y,
    "Reasons for check-in",
    "Reason",
    report.byReason,
    report.totalCheckIns,
  );
  y = tallyTable(doc, y, "By grade", "Grade", report.byGrade, report.totalCheckIns);
  y = tallyTable(doc, y, "By month", "Month", report.byMonth, report.totalCheckIns);

  if (report.topStudents.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 28, 40);
    doc.text("Most frequent check-ins", MARGIN, y);
    autoTable(doc, {
      startY: y + 8,
      head: [["Student", "Grade", "Check-ins"]],
      body: report.topStudents.map((s) => [s.label, s.grade, String(s.count)]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: HEAD_FILL, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: MARGIN, right: MARGIN },
      columnStyles: {
        1: { cellWidth: 60, halign: "right" },
        2: { cellWidth: 80, halign: "right" },
      },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(110, 120, 135);
    doc.text(
      `Prepared for school leadership and program reporting. Counts only — individual notes stay in the daily log.   Page ${page} of ${pageCount}`,
      MARGIN,
      doc.internal.pageSize.getHeight() - 24,
      { maxWidth: contentWidth },
    );
  }

  const suffix = report.range.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`student-support-summary-${suffix}.pdf`);
}
