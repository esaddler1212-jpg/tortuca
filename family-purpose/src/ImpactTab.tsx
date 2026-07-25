import { useMemo, useState } from "react";
import type { CheckIn, DebriefSettings, GroupSession } from "./types";
import { defaultPeriodChoice, periodChoices } from "./periods";
import PeriodPicker from "./PeriodPicker";
import {
  buildImpactReport,
  buildImpactText,
  describeAttendanceTrend,
  describeReasonShift,
} from "./impact";
import { buildMailtoUrl } from "./debrief";

function signed(value: number, suffix = ""): string {
  return value > 0 ? `+${value}${suffix}` : `${value}${suffix}`;
}

function changeClass(value: number): string {
  if (value > 0) return "delta delta-up";
  if (value < 0) return "delta delta-down";
  return "delta";
}

export default function ImpactTab({
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
    () => buildImpactReport(checkIns, sessions, period.range),
    [checkIns, sessions, period],
  );
  const text = useMemo(
    () => buildImpactText(report, settings),
    [report, settings],
  );

  const groupName = settings.groupName.trim() || "Group";
  const { engagement, attendance, reasonMix, outcomes } = report;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    onCopied();
  };

  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const { downloadImpactPdf } = await import("./impactPdf");
      downloadImpactPdf(report, settings);
      onPdfDownloaded();
    } finally {
      setPdfBusy(false);
    }
  };

  const emailTo = (recipients: string[]) => {
    window.location.href = buildMailtoUrl(
      recipients,
      `Student impact summary — ${report.range.label}`,
      text,
    );
  };

  return (
    <>
      <div className="card">
        <h2>Impact</h2>
        <p className="hint" style={{ marginBottom: "1rem" }}>
          Whether students come back, whether {groupName} attendance is holding,
          what conversations are about, and how they end.
        </p>

        <PeriodPicker
          id="impactPeriod"
          choices={choices}
          value={period}
          onChange={setPeriod}
        />
      </div>

      <div className="card">
        <h2>Students who come back</h2>
        <div className="stat-grid">
          <div className="stat">
            <span className="stat-value">{engagement.studentsSeen}</span>
            <span className="stat-label">Students seen</span>
          </div>
          <div className="stat">
            <span className="stat-value">{engagement.returningShare}%</span>
            <span className="stat-label">
              Returned ({engagement.returning} students)
            </span>
          </div>
          <div className="stat">
            <span className="stat-value">{engagement.sustained}</span>
            <span className="stat-label">Four or more check-ins</span>
          </div>
          <div className="stat">
            <span className="stat-value">{engagement.averagePerStudent}</span>
            <span className="stat-label">Average per student</span>
          </div>
        </div>

        {engagement.students.length === 0 ? (
          <p className="empty-state">No check-ins in this period yet.</p>
        ) : (
          <table className="data-table" aria-label="Returning students">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Grade</th>
                <th scope="col">Check-ins</th>
                <th scope="col">Weeks</th>
              </tr>
            </thead>
            <tbody>
              {engagement.students.slice(0, 10).map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.grade}</td>
                  <td>{s.checkIns}</td>
                  <td>{s.weeksEngaged}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>{groupName} attendance trend</h2>
        <p className="hint">{describeAttendanceTrend(attendance)}</p>
        {attendance.members.length === 0 ? (
          <p className="empty-state">No group sessions in this period yet.</p>
        ) : (
          <table className="data-table" aria-label="Attendance by member">
            <thead>
              <tr>
                <th scope="col">Member</th>
                <th scope="col">Attended</th>
                <th scope="col">Rate</th>
              </tr>
            </thead>
            <tbody>
              {attendance.members.map((m) => (
                <tr key={m.name}>
                  <td>{m.name}</td>
                  <td>
                    {m.attended} of {attendance.sessionsHeld}
                  </td>
                  <td>{m.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>What check-ins are about</h2>
        <p className="hint">{describeReasonShift(reasonMix)}</p>
        {reasonMix.split && (
          <table className="data-table" aria-label="Reason mix over time">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Earlier</th>
                <th scope="col">Later</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              {reasonMix.categories.map((c) => (
                <tr key={c.category}>
                  <td>{c.category}</td>
                  <td>{c.earlierShare}%</td>
                  <td>{c.laterShare}%</td>
                  <td className={changeClass(c.change)}>
                    {signed(c.change, " pts")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Outcomes</h2>
        {outcomes.recorded === 0 ? (
          <p className="empty-state">
            No outcomes recorded in this period. Tap an outcome when logging a
            check-in and it will show up here.
          </p>
        ) : (
          <>
            <p className="hint">
              Recorded on {outcomes.recorded} of{" "}
              {outcomes.recorded + outcomes.missing} check-ins (
              {outcomes.recordedShare}%).
            </p>
            <table className="data-table" aria-label="Outcomes">
              <thead>
                <tr>
                  <th scope="col">Outcome</th>
                  <th scope="col">Count</th>
                  <th scope="col">Share</th>
                </tr>
              </thead>
              <tbody>
                {outcomes.counts.map((o) => (
                  <tr key={o.outcome}>
                    <td>{o.outcome}</td>
                    <td>{o.count}</td>
                    <td>{o.share}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="card">
        <h2>Share</h2>
        <div className="debrief-preview" aria-label="Impact summary preview">
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
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => copy()}
          >
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
    </>
  );
}
