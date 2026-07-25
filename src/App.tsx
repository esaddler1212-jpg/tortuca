import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CHECK_IN_REASONS,
  GRADES,
  type CheckIn,
  type CheckInReason,
  type DebriefSettings,
} from "./types";
import {
  addCheckIn,
  deleteCheckIn,
  loadDebriefSettings,
  loadTodayCheckIns,
  saveDebriefSettings,
  getTodayDateLabel,
} from "./storage";
import { buildDebriefText, buildMailtoUrl } from "./debrief";
import { downloadDebriefPdf } from "./debriefPdf";

type Tab = "log" | "debrief" | "settings";

function CheckInForm({ onSaved }: { onSaved: () => void }) {
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState<string>("9");
  const [classPeriod, setClassPeriod] = useState("");
  const [reasons, setReasons] = useState<CheckInReason[]>([]);
  const [reasonNotes, setReasonNotes] = useState("");
  const [error, setError] = useState("");

  const toggleReason = (r: CheckInReason) => {
    setReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!studentName.trim()) {
      setError("Student name is required.");
      return;
    }
    if (!classPeriod.trim()) {
      setError("Class period is required.");
      return;
    }
    if (reasons.length === 0 && !reasonNotes.trim()) {
      setError("Select at least one reason or add notes explaining why.");
      return;
    }
    addCheckIn({
      studentName: studentName.trim(),
      grade,
      classPeriod: classPeriod.trim(),
      reasons,
      reasonNotes: reasonNotes.trim(),
    });
    setStudentName("");
    setClassPeriod("");
    setReasons([]);
    setReasonNotes("");
    onSaved();
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>Log a check-in</h2>
      <div className="field">
        <label htmlFor="studentName">Student name</label>
        <input
          id="studentName"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="e.g. Maria Lopez"
          autoComplete="name"
        />
      </div>
      <div className="row-2">
        <div className="field">
          <label htmlFor="grade">Grade</label>
          <select
            id="grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="period">Class period</label>
          <input
            id="period"
            value={classPeriod}
            onChange={(e) => setClassPeriod(e.target.value)}
            placeholder="e.g. Period 3 — Algebra"
          />
        </div>
      </div>
      <div className="field">
        <label>Reason(s) for check-in</label>
        <div className="reason-grid">
          {CHECK_IN_REASONS.map((r) => (
            <label key={r} className="reason-chip">
              <input
                type="checkbox"
                checked={reasons.includes(r)}
                onChange={() => toggleReason(r)}
              />
              <span>{r}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="reasonNotes">Additional details (why)</label>
        <textarea
          id="reasonNotes"
          rows={3}
          value={reasonNotes}
          onChange={(e) => setReasonNotes(e.target.value)}
          placeholder="Brief context for school staff and your program…"
        />
      </div>
      {error && (
        <p style={{ color: "var(--danger)", marginBottom: "1rem" }}>{error}</p>
      )}
      <button type="submit" className="btn btn-primary">
        Save check-in
      </button>
    </form>
  );
}

function TodayList({
  checkIns,
  onDelete,
}: {
  checkIns: CheckIn[];
  onDelete: () => void;
}) {
  if (checkIns.length === 0) {
    return (
      <div className="card empty-state">
        No check-ins yet today. Log your first student above.
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Today&apos;s check-ins ({checkIns.length})</h2>
      <ul className="checkin-list">
        {checkIns.map((c) => (
          <li key={c.id} className="checkin-item">
            <div className="checkin-item-header">
              <h3>{c.studentName}</h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  deleteCheckIn(c.id);
                  onDelete();
                }}
              >
                Remove
              </button>
            </div>
            <p className="checkin-meta">
              Grade {c.grade} · {c.classPeriod} ·{" "}
              {new Date(c.createdAt).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <div className="checkin-reasons">
              {c.reasons.length > 0 && (
                <p style={{ margin: "0 0 0.25rem" }}>
                  {c.reasons.join(" · ")}
                </p>
              )}
              {c.reasonNotes && (
                <p style={{ margin: 0, color: "var(--text-muted)" }}>
                  {c.reasonNotes}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DebriefPanel({
  checkIns,
  settings,
  onCopied,
  onPdfDownloaded,
}: {
  checkIns: CheckIn[];
  settings: DebriefSettings;
  onCopied: () => void;
  onPdfDownloaded: () => void;
}) {
  const text = useMemo(
    () => buildDebriefText(checkIns, settings),
    [checkIns, settings],
  );

  const subject = `Daily student check-in debrief — ${getTodayDateLabel()}`;

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    onCopied();
  };

  const emailBoth = () => {
    const recipients = [settings.staffEmail, settings.companyEmail];
    window.location.href = buildMailtoUrl(recipients, subject, text);
  };

  const emailStaff = () => {
    window.location.href = buildMailtoUrl(
      [settings.staffEmail],
      subject,
      text,
    );
  };

  const emailCompany = () => {
    window.location.href = buildMailtoUrl(
      [settings.companyEmail],
      subject,
      text,
    );
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
          onClick={() => {
            downloadDebriefPdf(checkIns, settings);
            onPdfDownloaded();
          }}
        >
          Download PDF
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => copy()}>
          Copy to clipboard
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={emailBoth}
          disabled={!settings.staffEmail && !settings.companyEmail}
        >
          Email staff & company
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={emailStaff}
          disabled={!settings.staffEmail}
        >
          Email school staff only
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={emailCompany}
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

function SettingsPanel({
  settings,
  onSave,
}: {
  settings: DebriefSettings;
  onSave: (s: DebriefSettings) => void;
}) {
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const update = (key: keyof DebriefSettings, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        saveDebriefSettings(form);
        onSave(form);
      }}
    >
      <h2>Debrief & profile</h2>
      <p className="hint" style={{ marginBottom: "1rem" }}>
        These appear on your daily debrief and pre-fill email recipients.
      </p>
      <div className="field">
        <label htmlFor="yourName">Your name</label>
        <input
          id="yourName"
          value={form.yourName}
          onChange={(e) => update("yourName", e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="yourRole">Your role / program</label>
        <input
          id="yourRole"
          value={form.yourRole}
          onChange={(e) => update("yourRole", e.target.value)}
          placeholder="e.g. Community mentor, XYZ Corp"
        />
      </div>
      <div className="field">
        <label htmlFor="schoolName">School name</label>
        <input
          id="schoolName"
          value={form.schoolName}
          onChange={(e) => update("schoolName", e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="staffEmail">School staff email</label>
        <input
          id="staffEmail"
          type="email"
          value={form.staffEmail}
          onChange={(e) => update("staffEmail", e.target.value)}
          placeholder="counselor@school.edu"
        />
      </div>
      <div className="field">
        <label htmlFor="companyEmail">Company / program email</label>
        <input
          id="companyEmail"
          type="email"
          value={form.companyEmail}
          onChange={(e) => update("companyEmail", e.target.value)}
          placeholder="supervisor@company.com"
        />
      </div>
      <button type="submit" className="btn btn-primary">Save settings</button>
    </form>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("log");
  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => loadTodayCheckIns());
  const [settings, setSettings] = useState<DebriefSettings>(() =>
    loadDebriefSettings(),
  );
  const [toast, setToast] = useState("");

  const refresh = useCallback(() => {
    setCheckIns(loadTodayCheckIns());
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Tortuca</h1>
        <p>{getTodayDateLabel()} — student check-in log</p>
      </header>

      <nav className="tabs" aria-label="Main">
        <button
          type="button"
          className={`tab ${tab === "log" ? "active" : ""}`}
          onClick={() => setTab("log")}
        >
          Log
        </button>
        <button
          type="button"
          className={`tab ${tab === "debrief" ? "active" : ""}`}
          onClick={() => setTab("debrief")}
        >
          Debrief
        </button>
        <button
          type="button"
          className={`tab ${tab === "settings" ? "active" : ""}`}
          onClick={() => setTab("settings")}
        >
          Settings
        </button>
      </nav>

      {tab === "log" && (
        <>
          <CheckInForm
            onSaved={() => {
              refresh();
              showToast("Check-in saved");
            }}
          />
          <TodayList checkIns={checkIns} onDelete={refresh} />
        </>
      )}

      {tab === "debrief" && (
        <DebriefPanel
          checkIns={checkIns}
          settings={settings}
          onCopied={() => showToast("Debrief copied")}
          onPdfDownloaded={() => showToast("PDF downloaded")}
        />
      )}

      {tab === "settings" && (
        <SettingsPanel
          settings={settings}
          onSave={(s) => {
            setSettings(s);
            showToast("Settings saved");
          }}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
