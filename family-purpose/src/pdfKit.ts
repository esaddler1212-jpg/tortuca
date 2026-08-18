import { jsPDF } from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import type { DebriefSettings } from "./types";
import type { DateRange } from "./reports";

export const MARGIN = 40;
const HEAD_FILL: [number, number, number] = [36, 58, 88];
const INK: [number, number, number] = [20, 28, 40];
const BODY: [number, number, number] = [40, 48, 60];
const MUTED: [number, number, number] = [110, 120, 135];

export function createDoc(): jsPDF {
  return new jsPDF({ unit: "pt", format: "letter" });
}

export function contentWidth(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth() - MARGIN * 2;
}

function tableBottom(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
}

export function drawHeader(
  doc: jsPDF,
  title: string,
  range: DateRange,
  settings: DebriefSettings,
): number {
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(title, MARGIN, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...BODY);
  doc.text(range.label, MARGIN, y);
  y += 15;

  // A single-day document already says the date in its label.
  if (range.start !== range.end) {
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`${range.start} through ${range.end}`, MARGIN, y);
    y += 18;
  }

  doc.setFontSize(11);
  doc.setTextColor(...BODY);
  const name = settings.yourName.trim() || "Staff member";
  const role = settings.yourRole.trim();
  if (settings.schoolName.trim()) {
    doc.text(`School: ${settings.schoolName.trim()}`, MARGIN, y);
    y += 14;
  }
  doc.text(`Prepared by: ${role ? `${name} (${role})` : name}`, MARGIN, y);

  return y + 24;
}

export function drawParagraph(doc: jsPDF, y: number, text: string): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY);
  const lines = doc.splitTextToSize(text, contentWidth(doc)) as string[];
  doc.text(lines, MARGIN, y);
  return y + lines.length * 13 + 10;
}

export function drawTable(
  doc: jsPDF,
  y: number,
  title: string | null,
  head: string[],
  body: string[][],
  columnStyles: UserOptions["columnStyles"] = {},
): number {
  if (body.length === 0) return y;

  let startY = y;
  if (title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(title, MARGIN, startY);
    startY += 8;
  }

  autoTable(doc, {
    startY,
    head: [head],
    body,
    styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: HEAD_FILL, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: MARGIN, right: MARGIN },
    columnStyles,
  });

  return tableBottom(doc) + 24;
}

export function drawFooter(doc: jsPDF, note: string): void {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `${note}   Page ${page} of ${pageCount}`,
      MARGIN,
      doc.internal.pageSize.getHeight() - 24,
      { maxWidth: contentWidth(doc) },
    );
  }
}

export function fileSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
