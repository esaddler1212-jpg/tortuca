import { useMemo, useState } from "react";
import type { CheckIn, DebriefSettings, GroupSession } from "./types";
import { getTodayDateLabel } from "./storage";
import { buildDebriefText, buildMailtoUrl } from "./debrief";

export default function DebriefTab({
  checkIns,
  session,
  settings,
  onCopied,
  onPdfDownloaded,
}: {
  checkIns: CheckIn[];
  session: GroupSession | null;
  settings: DebriefSettings;
  onCopied: () => void;
  onPdfDownloaded: () => void;
}) {
  const [pdfBusy, setPdfBusy] = useState(false);

  const text = useMemo(
    () => buildDebriefText(checkIns, settings, session),
    [checkIns, settings, session],
  );

  const subject = `Daily student check-in debrief — ${getTodayDateLabel()}`;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    onCopied();
  };

  /** The PDF library is heavy, so it loads only when a PDF is requested. */
  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const { downloadDebriefPdf } = await import("./debriefPdf");
      downloadDebriefPdf(checkIns, settings, session);
      onPdfDownloaded();
    } finally {
      setPdfBusy(false);
    }
  };

  const emailTo = (recipients: string[]) => {
    window.location.href = buildMailtoUrl(recipients, subject, text);
  };

  return (
    <div className="card">
      <h2>End-of-day debrief</h2>
      <p className="hint" style={{ marginBottom: "1rem" }}>
        Review the summary below, then download a PDF, copy text, or open your
        email app to send to school staff and your employer.
      </p>
      <div className="debrief-preview" aria-label="Debrief preview">
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
      </div>
      {!settings.staffEmail && !settings.companyEmail && (
        <p className="hint">
          Add email addresses in Settings so &quot;Email&quot; buttons pre-fill
          recipients.
        </p>
      )}
    </div>
  );
}
