import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  GRADES,
  type CheckIn,
  type CheckInReason,
  type DebriefSettings,
} from "./types";
import {
  addCheckIn,
  deleteCheckIn,
  loadAllCheckIns,
  loadDebriefSettings,
  loadTodayCheckIns,
  saveDebriefSettings,
  getTodayDateLabel,
} from "./storage";
import {
  buildRecentPeriods,
  buildRoster,
  findStudent,
  normalizeName,
  orderReasonsByUse,
  type StudentProfile,
} from "./roster";
import { buildDebriefText, buildMailtoUrl } from "./debrief";

type Tab = "log" | "debrief" | "settings";

function CheckInForm({
  roster,
  recentPeriods,
  reasonOrder,
  todayNames,
  onSaved,
}: {
  roster: StudentProfile[];
  recentPeriods: string[];
  reasonOrder: CheckInReason[];
  todayNames: Set<string>;
  onSaved: () => void;
}) {
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState<string>("9");
  const [classPeriod, setClassPeriod] = useState("");
  const [reasons, setReasons] = useState<CheckInReason[]>([]);
  const [reasonNotes, setReasonNotes] = useState("");
  const [error, setError] = useState("");
  const nameInput = useRef<HTMLInputElement>(null);

  const toggleReason = (r: CheckInReason) => {
    setReasons((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  };

  /** Typing or picking a known student fills in their grade and period. */
  const applyStudent = (name: string) => {
    setStudentName(name);
    const known = findStudent(roster, name);
    if (known) {
      setGrade(known.grade);
      setClassPeriod(known.classPeriod);
    }
  };

  const quickPick = (student: StudentProfile) => {
    applyStudent(student.name);
    nameInput.current?.focus();
  };

  const alreadyLoggedToday =
    studentName.trim().length > 0 && todayNames.has(normalizeName(studentName));

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
    // Grade and period carry over: consecutive check-ins usually share a class.
    setStudentName("");
    setReasons([]);
    setReasonNotes("");
    nameInput.current?.focus();
    onSaved();
  };

  const suggestions = roster.slice(0, 8);

  return (
    <form className="card" onSubmit={submit}>
      <h2>Log a check-in</h2>

      {suggestions.length > 0 && (
        <div className="field">
          <label>Recent students — tap to fill</label>
          <div className="pill-row">
            {suggestions.map((s) => (
              <button
                key={s.name}
                type="button"
                className="pill"
                onClick={() => quickPick(s)}
              >
                {s.name}
                <span className="pill-meta">Gr {s.grade}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="studentName">Student name</label>
        <input
          id="studentName"
          ref={nameInput}
          value={studentName}
          onChange={(e) => applyStudent(e.target.value)}
          placeholder="e.g. Maria Lopez"
          list="roster-names"
          autoComplete="off"
          enterKeyHint="done"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        <datalist id="roster-names">
          {roster.map((s) => (
            <option key={s.name} value={s.name} />
          ))}
        </datalist>
        {alreadyLoggedToday && (
          <p className="hint">Already checked in today — this adds a second entry.</p>
        )}
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
            list="recent-periods"
            autoComplete="off"
          />
          <datalist id="recent-periods">
            {recentPeriods.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
      </div>

      {recentPeriods.length > 0 && (
        <div className="field">
          <label>Recent periods</label>
          <div className="pill-row">
            {recentPeriods.map((p) => (
              <button
                key={p}
                type="button"
                className={`pill ${classPeriod === p ? "pill-active" : ""}`}
                onClick={() => setClassPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label id="reasons-label">Reason(s) for check-in</label>
        <div className="pill-row" role="group" aria-labelledby="reasons-label">
          {reasonOrder.map((r) => {
            const selected = reasons.includes(r);
            return (
              <button
                key={r}
                type="button"
                className={`pill ${selected ? "pill-active" : ""}`}
                aria-pressed={selected}
                onClick={() => toggleReason(r)}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      <div className="field">
        <label htmlFor="reasonNotes">Additional details (optional)</label>
        <textarea
          id="reasonNotes"
          rows={2}
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
      <p className="hint">
        Grade and period stay set after saving, so back-to-back check-ins in the
        same class only need a name and a reason.
      </p>
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
                <p style={{ margin: "0 0 0.25rem" }}>{c.reasons.join(" · ")}</p>
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
  const [pdfBusy, setPdfBusy] = useState(false);

  const text = useMemo(
    () => buildDebriefText(checkIns, settings),
    [checkIns, settings],
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
      downloadDebriefPdf(checkIns, settings);
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
      <h2>Debrief &amp; profile</h2>
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
      <button type="submit" className="btn btn-primary">
        Save settings
      </button>
    </form>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("log");
  const [revision, setRevision] = useState(0);
  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => loadTodayCheckIns());
  const [settings, setSettings] = useState<DebriefSettings>(() =>
    loadDebriefSettings(),
  );
  const [toast, setToast] = useState("");

  const refresh = useCallback(() => {
    setCheckIns(loadTodayCheckIns());
    setRevision((r) => r + 1);
  }, []);

  const history = useMemo(() => loadAllCheckIns(), [revision]);
  const roster = useMemo(() => buildRoster(history), [history]);
  const recentPeriods = useMemo(() => buildRecentPeriods(history), [history]);
  const reasonOrder = useMemo(() => orderReasonsByUse(history), [history]);
  const todayNames = useMemo(
    () => new Set(checkIns.map((c) => normalizeName(c.studentName))),
    [checkIns],
  );

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
            roster={roster}
            recentPeriods={recentPeriods}
            reasonOrder={reasonOrder}
            todayNames={todayNames}
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

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
