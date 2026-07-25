import { useMemo, useState } from "react";
import type { CheckIn, DebriefSettings, GroupSession } from "./types";
import { buildPeriodReport, buildReportText } from "./reports";
import { defaultPeriodChoice, periodChoices } from "./periods";
import PeriodPicker from "./PeriodPicker";
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
  const choices = useMemo(
    () => periodChoices(checkIns, sessions),
    [checkIns, sessions],
  );
  const [period, setPeriod] = useState(() =>
    defaultPeriodChoice(choices, checkIns, sessions),
  );
  const [pdfBusy, setPdfBusy] = useState(false);

  const report = useMemo(
    () => buildPeriodReport(checkIns, sessions, period.range),
    [checkIns, sessions, period],
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
        company as-is. Quarters, semesters and trimesters follow the district
        calendar.
      </p>

      <PeriodPicker
        id="reportPeriod"
        choices={choices}
        value={period}
        onChange={setPeriod}
      />

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
