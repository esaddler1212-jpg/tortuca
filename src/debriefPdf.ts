import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CheckIn, DebriefSettings } from "./types";
import { getTodayDateLabel } from "./storage";

function pdfFileDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatReasons(checkIn: CheckIn): string {
  const parts: string[] = [...checkIn.reasons];
  if (checkIn.reasonNotes.trim()) {
    parts.push(checkIn.reasonNotes.trim());
  }
  return parts.join("; ") || "—";
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
): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 28, 40);
  doc.text("End of Day Check-In Debrief", margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(40, 48, 60);
  doc.text(getTodayDateLabel(), margin, y);
  y += 16;

  const name = settings.yourName.trim() || "Staff member";
  const school = settings.schoolName.trim();
  const role = settings.yourRole.trim();

  if (school) {
    doc.text(`School: ${school}`, margin, y);
    y += 14;
  }
  if (role) {
    doc.text(`Prepared by: ${name} (${role})`, margin, y);
    y += 14;
  } else {
    doc.text(`Prepared by: ${name}`, margin, y);
    y += 14;
  }
  doc.text(`Total student check-ins: ${checkIns.length}`, margin, y);
  y += 22;

  if (checkIns.length === 0) {
    doc.setFontSize(10);
    doc.text(
      "No student check-ins were logged for today. If check-ins occurred, please update the log and regenerate this debrief.",
      margin,
      y,
      { maxWidth: contentWidth },
    );
  } else {
    const sorted = [...checkIns].sort((a, b) =>
      a.studentName.localeCompare(b.studentName),
    );

    autoTable(doc, {
      startY: y,
      head: [["Student", "Grade", "Period", "Time", "Reason(s)"]],
      body: sorted.map((c) => [
        c.studentName,
        c.grade,
        c.classPeriod,
        formatTime(c.createdAt),
        formatReasons(c),
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 6,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: {
        fillColor: [36, 58, 88],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 42 },
        2: { cellWidth: 100 },
        3: { cellWidth: 48 },
        4: { cellWidth: "auto" },
      },
    });
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(110, 120, 135);
  doc.text(
    "This debrief documents same-day student check-ins for school staff and program reporting. Please reach out if any follow-up is needed.",
    margin,
    pageHeight - 28,
    { maxWidth: contentWidth },
  );

  doc.save(`check-in-debrief-${pdfFileDate()}.pdf`);
}
