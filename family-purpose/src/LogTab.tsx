import { useMemo, useRef, useState } from "react";
import {
  CHECK_IN_OUTCOMES,
  GRADES,
  type CheckIn,
  type CheckInOutcome,
  type CheckInReason,
} from "./types";
import { addCheckIn, deleteCheckIn } from "./storage";
import {
  findStudent,
  normalizeName,
  type StudentProfile,
} from "./roster";

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
  const [outcome, setOutcome] = useState<CheckInOutcome | null>(null);
  const [reasonNotes, setReasonNotes] = useState("");
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);

  /**
   * A hand-rolled list rather than a native <datalist>: the native popup is
   * unreliable on mobile and Chrome clears the field when Escape closes it.
   */
  const nameMatches = useMemo(() => {
    const query = normalizeName(studentName);
    if (!query) return [];
    return roster
      .filter((s) => {
        const candidate = normalizeName(s.name);
        return candidate.includes(query) && candidate !== query;
      })
      .slice(0, 5);
  }, [roster, studentName]);

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
    setShowSuggestions(false);
  };

  /** Escape clears the field it is pressed in, matching browser expectations. */
  const clearOnEscape =
    (clear: () => void) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Escape") return;
      clear();
      setShowSuggestions(false);
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
      ...(outcome ? { outcome } : {}),
    });
    // Grade and period carry over: consecutive check-ins usually share a class.
    setStudentName("");
    setReasons([]);
    setOutcome(null);
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
          <label id="recent-students-label">Recent students — tap to fill</label>
          <div
            className="pill-row"
            role="group"
            aria-labelledby="recent-students-label"
          >
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
          onChange={(e) => {
            applyStudent(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setShowSuggestions(false)}
          onKeyDown={clearOnEscape(() => setStudentName(""))}
          placeholder="e.g. Maria Lopez"
          autoComplete="off"
          enterKeyHint="done"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        {showSuggestions && nameMatches.length > 0 && (
          <ul className="suggestions" aria-label="Matching students">
            {nameMatches.map((s) => (
              <li key={s.name}>
                <button
                  type="button"
                  className="suggestion"
                  // Fires before blur, so the click is never lost.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    quickPick(s);
                  }}
                >
                  <span>{s.name}</span>
                  <span className="pill-meta">
                    Gr {s.grade} · {s.classPeriod}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {alreadyLoggedToday && (
          <p className="hint">
            Already checked in today — this adds a second entry.
          </p>
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
            onKeyDown={clearOnEscape(() => setClassPeriod(""))}
            placeholder="e.g. Period 3 — Algebra"
            autoComplete="off"
          />
        </div>
      </div>

      {recentPeriods.length > 0 && (
        <div className="field">
          <label id="recent-periods-label">Recent periods</label>
          <div
            className="pill-row"
            role="group"
            aria-labelledby="recent-periods-label"
          >
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
        <label id="outcome-label">Outcome (optional)</label>
        <div className="pill-row" role="group" aria-labelledby="outcome-label">
          {CHECK_IN_OUTCOMES.map((o) => {
            const selected = outcome === o;
            return (
              <button
                key={o}
                type="button"
                className={`pill ${selected ? "pill-active" : ""}`}
                aria-pressed={selected}
                onClick={() => setOutcome(selected ? null : o)}
              >
                {o}
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
      <ul className="checkin-list" aria-label="Today's check-ins">
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

export default function LogTab({
  roster,
  recentPeriods,
  reasonOrder,
  todayCheckIns,
  onChanged,
}: {
  roster: StudentProfile[];
  recentPeriods: string[];
  reasonOrder: CheckInReason[];
  todayCheckIns: CheckIn[];
  onChanged: (message?: string) => void;
}) {
  const todayNames = useMemo(
    () => new Set(todayCheckIns.map((c) => normalizeName(c.studentName))),
    [todayCheckIns],
  );

  return (
    <>
      <CheckInForm
        roster={roster}
        recentPeriods={recentPeriods}
        reasonOrder={reasonOrder}
        todayNames={todayNames}
        onSaved={() => onChanged("Check-in saved")}
      />
      <TodayList checkIns={todayCheckIns} onDelete={() => onChanged()} />
    </>
  );
}
