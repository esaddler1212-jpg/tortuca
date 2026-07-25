import { useMemo, useState } from "react";
import type { CheckIn, DebriefSettings, GroupSession } from "./types";
import {
  PERIOD_OPTIONS,
  availableYears,
  buildPeriodReport,
  buildReportText,
  type PeriodScope,
} from "./reports";
import { buildMailtoUrl } from "./debrief";

function StatGrid({
  report,
  groupName,
}: {
  report: ReturnType<typeof buildPeriodReport>;
  groupName: string;
}) {
  const stats = [
    { label: "Check-ins", value: report.totalCheckIns },
    { label: "Students served", value: report.uniqueStudents },
    { label: `${groupName} sessions`, value: report.group.sessions },
    { label: "Members signed in", value: report.group.uniqueAttendees },
    { label: "Avg. attendance", value: report.group.averageAttendance },
  ];

  return (
    <div className="stat-grid">
      {stats.map((s) => (
        <div key={s.label} className="stat">
          <span className="stat-value">{s.value}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsTab({
  checkIns,
  sessions,
  settings,
  onCopied,
  onPdfDownloaded,
}: {
  checkIns: CheckIn[];
  sessions: GroupSession[];
  settings: DebriefSettings;
  onCopied: () => void;
  onPdfDownloaded: () => void;
}) {
  const years = useMemo(
    () => availableYears(checkIns, sessions),
    [checkIns, sessions],
  );
  const [year, setYear] = useState(years[0]);
  const [scope, setScope] = useState<PeriodScope>("year");
  const [pdfBusy, setPdfBusy] = useState(false);

  const report = useMemo(
    () => buildPeriodReport(checkIns, sessions, year, scope),
    [checkIns, sessions, year, scope],
  );
  const text = useMemo(
    () => buildReportText(report, settings),
    [report, settings],
  );

  const groupName = settings.groupName.trim() || "Group";

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    onCopied();
  };

  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const { downloadReportPdf } = await import("./reportPdf");
      downloadReportPdf(report, settings);
      onPdfDownloaded();
    } finally {
      setPdfBusy(false);
    }
  };

  const emailTo = (recipients: string[]) => {
    window.location.href = buildMailtoUrl(
      recipients,
      `Student support summary — ${report.range.label}`,
      text,
    );
  };

  return (
    <div className="card">
      <h2>Quarterly &amp; yearly summary</h2>
      <p className="hint" style={{ marginBottom: "1rem" }}>
        Counts only — no individual notes — so it can go to the school and your
        company as-is.
      </p>

      <div className="row-2">
        <div className="field">
          <label htmlFor="reportYear">Year</label>
          <select
            id="reportYear"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="reportScope">Period</label>
          <select
            id="reportScope"
            value={scope}
            onChange={(e) => setScope(e.target.value as PeriodScope)}
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.scope} value={o.scope}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <StatGrid report={report} groupName={groupName} />

      <div className="debrief-preview" aria-label="Summary preview">
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
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => emailTo([settings.staffEmail, settings.companyEmail])}
          disabled={!settings.staffEmail && !settings.companyEmail}
        >
          Email staff &amp; company
        </button>
      </div>
    </div>
  );
}
