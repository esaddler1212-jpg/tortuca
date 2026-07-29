import { useMemo, useState } from "react";
import type { CheckIn, DebriefSettings, GroupSession } from "./types";
import { getTodayDateLabel, todayKey } from "./storage";
import { buildDebriefText, buildMailtoUrl } from "./debrief";
import {
  buildAttendanceListText,
  buildCareTeamText,
  buildWeeklySummary,
  buildWeeklySummaryText,
  weekRange,
} from "./documents";
import { careTeamReferrals } from "./followups";
import { PDF_PREP_HINT } from "./lowPowerHint";
import { yieldToMain } from "./yieldMain";

type DocumentId = "debrief" | "attendance" | "weekly" | "care";

const DOCUMENTS: { id: DocumentId; label: string; audience: string }[] = [
  { id: "debrief", label: "End-of-day debrief", audience: "School staff and Family Purpose" },
  { id: "attendance", label: "Attendance clerk list", audience: "The attendance clerk" },
  { id: "weekly", label: "Weekly summary", audience: "School staff and Family Purpose" },
  { id: "care", label: "CARE team referrals", audience: "The CARE team only" },
];

/** How far back the CARE team document reaches. */
const CARE_WINDOWS = [
  { id: "week", label: "This week" },
  { id: "month", label: "Last 30 days" },
  { id: "term", label: "Last 90 days" },
] as const;

type CareWindowId = (typeof CARE_WINDOWS)[number]["id"];

function careRange(id: CareWindowId): {
  start: string;
  end: string;
  label: string;
} {
  const today = todayKey();
  if (id === "week") {
    const week = weekRange(today);
    return { start: week.start, end: week.end, label: week.label };
  }
  const days = id === "month" ? 30 : 90;
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  return { start: startKey, end: today, label: `Last ${days} days` };
}

export default function DebriefTab({
  checkIns,
  allCheckIns,
  sessions,
  session,
  settings,
  onCopied,
  onPdfDownloaded,
}: {
  checkIns: CheckIn[];
  allCheckIns: CheckIn[];
  sessions: GroupSession[];
  session: GroupSession | null;
  settings: DebriefSettings;
  onCopied: () => void;
  onPdfDownloaded: () => void;
}) {
  const [docId, setDocId] = useState<DocumentId>("debrief");
  const [weeksBack, setWeeksBack] = useState(0);
  const [careWindow, setCareWindow] = useState<CareWindowId>("week");
  const [pdfBusy, setPdfBusy] = useState(false);

  const week = useMemo(
    () => weekRange(todayKey(), weeksBack),
    [weeksBack],
  );
  const weekly = useMemo(
    () => buildWeeklySummary(allCheckIns, sessions, week),
    [allCheckIns, sessions, week],
  );
  const care = useMemo(() => careRange(careWindow), [careWindow]);
  const referralCount = useMemo(
    () =>
      careTeamReferrals(
        allCheckIns.filter((c) => {
          const day = c.createdAt.slice(0, 10);
          return day >= care.start && day <= care.end;
        }),
      ).length,
    [allCheckIns, care],
  );

  const text = useMemo(() => {
    switch (docId) {
      case "attendance":
        return buildAttendanceListText(allCheckIns, todayKey(), settings);
      case "weekly":
        return buildWeeklySummaryText(weekly, settings);
      case "care":
        return buildCareTeamText(allCheckIns, care, settings);
      default:
        return buildDebriefText(checkIns, settings, session, allCheckIns);
    }
  }, [docId, allCheckIns, checkIns, settings, session, weekly, care]);

  const subject = useMemo(() => {
    switch (docId) {
      case "attendance":
        return `Student check-in list — ${getTodayDateLabel()}`;
      case "weekly":
        return `Weekly check-in summary — ${week.label}`;
      case "care":
        return `CARE team referrals — ${care.label}`;
      default:
        return `Daily student check-in debrief — ${getTodayDateLabel()}`;
    }
  }, [docId, week, care]);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    onCopied();
  };

  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      await yieldToMain();
      if (docId === "debrief") {
        const { downloadDebriefPdf } = await import("./debriefPdf");
        await yieldToMain();
        downloadDebriefPdf(checkIns, settings, session, allCheckIns);
      } else {
        const pdfs = await import("./documentPdfs");
        await yieldToMain();
        if (docId === "attendance") {
          pdfs.downloadAttendanceListPdf(allCheckIns, todayKey(), settings);
        } else if (docId === "weekly") {
          pdfs.downloadWeeklySummaryPdf(weekly, settings);
        } else {
          pdfs.downloadCareTeamPdf(allCheckIns, care, settings);
        }
      }
      onPdfDownloaded();
    } finally {
      setPdfBusy(false);
    }
  };

  const emailTo = (recipients: string[]) => {
    window.location.href = buildMailtoUrl(recipients, subject, text);
  };

  const active = DOCUMENTS.find((d) => d.id === docId)!;
  const careOnly = docId === "care";

  return (
    <div className="card">
      <h2>Send a debrief</h2>

      <div className="field">
        <label id="document-label">Document</label>
        <div className="pill-row" role="group" aria-labelledby="document-label">
          {DOCUMENTS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`pill ${docId === d.id ? "pill-active" : ""}`}
              aria-pressed={docId === d.id}
              onClick={() => setDocId(d.id)}
            >
              {d.label}
              {d.id === "care" && referralCount > 0 && (
                <span className="pill-meta">{referralCount}</span>
              )}
            </button>
          ))}
        </div>
        <p className="hint">For: {active.audience}</p>
      </div>

      {docId === "weekly" && (
        <div className="field">
          <label htmlFor="weekPicker">Week</label>
          <select
            id="weekPicker"
            value={weeksBack}
            onChange={(e) => setWeeksBack(Number(e.target.value))}
          >
            <option value={0}>This week</option>
            <option value={1}>Last week</option>
            <option value={2}>Two weeks ago</option>
            <option value={3}>Three weeks ago</option>
          </select>
        </div>
      )}

      {careOnly && (
        <div className="field">
          <label htmlFor="careWindow">Referrals from</label>
          <select
            id="careWindow"
            value={careWindow}
            onChange={(e) => setCareWindow(e.target.value as CareWindowId)}
          >
            {CARE_WINDOWS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
          <p className="hint">
            Confidential. Send this to the CARE team only — the daily debrief
            notes that a referral was made without repeating the detail.
          </p>
        </div>
      )}

      <div className="debrief-preview" aria-label={`${active.label} preview`}>
        {text}
      </div>

      <div className="btn-row">
        <button
          type="button"
          className="btn btn-primary"
          onClick={downloadPdf}
          disabled={pdfBusy}
        >
          {pdfBusy ? "Preparing PDF…" : "Download PDF"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => copy()}>
          Copy to clipboard
        </button>
        {careOnly ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => emailTo([settings.careTeamEmail])}
            disabled={!settings.careTeamEmail}
          >
            Email CARE team
          </button>
        ) : docId === "attendance" ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => emailTo([settings.attendanceEmail])}
            disabled={!settings.attendanceEmail}
          >
            Email attendance clerk
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                emailTo([settings.staffEmail, settings.companyEmail])
              }
              disabled={!settings.staffEmail && !settings.companyEmail}
            >
              Email staff &amp; company
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => emailTo([settings.staffEmail])}
              disabled={!settings.staffEmail}
            >
              Email school staff only
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => emailTo([settings.companyEmail])}
              disabled={!settings.companyEmail}
            >
              Email company only
            </button>
          </>
        )}
      </div>

      {PDF_PREP_HINT && <p className="hint">{PDF_PREP_HINT}</p>}
      <p className="hint">
        Add recipients in Settings so the email buttons pre-fill addresses.
      </p>
    </div>
  );
}
