import { useEffect, useMemo, useRef, useState } from "react";
import {
  CHECK_IN_OUTCOMES,
  GRADES,
  DEFAULT_GRADE,
  type CheckIn,
  type CheckInOutcome,
  type CheckInReason,
} from "./types";
import { addCheckIn, deleteCheckIn } from "./storage";
import { createFollowUp, formatDueLabel } from "./followups";
import {
  findStudent,
  normalizeName,
  type StudentProfile,
} from "./roster";
import {
  classPeriods,
  formatPeriodRange,
  scheduleFor,
  suggestedPeriod,
} from "./schedule";
import ScheduleBanner from "./ScheduleBanner";

/** Re-renders on the minute so the live bell period stays accurate. */
function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

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
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState<string>(DEFAULT_GRADE);
  const [classPeriod, setClassPeriod] = useState("");
  const [reasons, setReasons] = useState<CheckInReason[]>([]);
  const [outcome, setOutcome] = useState<CheckInOutcome | null>(null);
  const [followUp, setFollowUp] = useState(false);
  const [reasonNotes, setReasonNotes] = useState("");
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);

  const now = useClock();
  const schedule = scheduleFor(now, grade);
  const bellPeriods = classPeriods(schedule);
  const livePeriod = suggestedPeriod(now, grade);
  const liveName = livePeriod?.name ?? "";
  /** What the bell schedule last filled in, so a typed value is never lost. */
  const autoFilled = useRef("");

  useEffect(() => {
    if (!liveName) return;
    setClassPeriod((current) => {
      if (current && current !== autoFilled.current) return current;
      autoFilled.current = liveName;
      return liveName;
    });
  }, [liveName]);

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

  /** Typing or picking a known student fills in their ID, grade and period. */
  const applyStudent = (name: string) => {
    setStudentName(name);
    const known = findStudent(roster, name);
    if (known) {
      setStudentId(known.studentId);
      setGrade(known.grade);
      setClassPeriod(known.classPeriod);
    }
  };

  /** Choosing this outcome implies a follow-up, so schedule one by default. */
  const pickOutcome = (o: CheckInOutcome | null) => {
    setOutcome(o);
    if (o === "Follow-up scheduled") setFollowUp(true);
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
    const now = new Date().toISOString();
    addCheckIn({
      studentName: studentName.trim(),
      ...(studentId.trim() ? { studentId: studentId.trim() } : {}),
      grade,
      classPeriod: classPeriod.trim(),
      reasons,
      reasonNotes: reasonNotes.trim(),
      ...(outcome ? { outcome } : {}),
      ...(followUp ? { followUp: createFollowUp(now) } : {}),
    });
    // Grade and period carry over: consecutive check-ins usually share a class.
    setStudentName("");
    setStudentId("");
    setReasons([]);
    setOutcome(null);
    setFollowUp(false);
    setReasonNotes("");
    nameInput.current?.focus();
    onSaved();
  };

  const suggestions = roster.slice(0, 8);
  /** Recent entries that carry a class name the bell schedule cannot supply. */
  const customPeriods = recentPeriods.filter(
    (p) => !bellPeriods.some((b) => b.name === p),
  );

  return (
    <form className="card" onSubmit={submit}>
      <h2>Log a check-in</h2>

      <ScheduleBanner now={now} grade={grade} />

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
          <label htmlFor="studentId">Student ID (optional)</label>
          <input
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            onKeyDown={clearOnEscape(() => setStudentId(""))}
            placeholder="e.g. 10482"
            inputMode="numeric"
            autoComplete="off"
          />
        </div>
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
      </div>

      <div className="field">
        <label htmlFor="period">Class period</label>
        <div
          className="pill-row"
          role="group"
          aria-label={`Bell schedule — ${schedule.label}`}
        >
          {bellPeriods.map((p) => {
            const isLive = livePeriod?.name === p.name;
            return (
              <button
                key={p.name}
                type="button"
                className={`pill ${classPeriod === p.name ? "pill-active" : ""}`}
                aria-label={`${p.name}, ${formatPeriodRange(p)}${isLive ? ", happening now" : ""}`}
                onClick={() => {
                  autoFilled.current = p.name;
                  setClassPeriod(p.name);
                }}
              >
                {p.name}
                <span className="pill-meta">
                  {isLive ? "now" : formatPeriodRange(p)}
                </span>
              </button>
            );
          })}
        </div>
        <input
          id="period"
          value={classPeriod}
          onChange={(e) => setClassPeriod(e.target.value)}
          onKeyDown={clearOnEscape(() => setClassPeriod(""))}
          placeholder="e.g. Period 3 — Algebra"
          autoComplete="off"
          className="field-tight"
        />
        <p className="hint">
          {schedule.label}. The period in session is filled in for you — tap
          another or type the class name.
        </p>
        {customPeriods.length > 0 && (
          <div
            className="pill-row field-tight"
            role="group"
            aria-label="Recent periods"
          >
            {customPeriods.map((p) => (
              <button
                key={p}
                type="button"
                className={`pill ${classPeriod === p ? "pill-active" : ""}`}
                onClick={() => {
                  autoFilled.current = p;
                  setClassPeriod(p);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

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
                onClick={() => pickOutcome(selected ? null : o)}
              >
                {o}
              </button>
            );
          })}
        </div>
        <p className="hint">
          Leave this blank now if you would rather record what happened later —
          the Follow-up tab lists anything still open.
        </p>
      </div>

      <div className="field">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={followUp}
            onChange={(e) => setFollowUp(e.target.checked)}
          />
          <span>Follow up within 48 hours</span>
        </label>
        {followUp && (
          <p className="hint">
            {formatDueLabel(createFollowUp(new Date().toISOString()))}. It will
            appear on the Follow-up tab and in today&apos;s debrief.
          </p>
        )}
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

      {error && <p className="form-error" role="alert">{error}</p>}

      <button type="submit" className="btn btn-primary btn-block">
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
        <span className="empty-state-icon" aria-hidden="true">✎</span>
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
              {c.studentId ? `ID ${c.studentId} · ` : ""}Grade {c.grade} ·{" "}
              {c.classPeriod} ·{" "}
              {new Date(c.createdAt).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            {(c.followUp || c.outcome) && (
              <div className="tag-row">
                {c.outcome && (
                  <span className="tag tag-outcome">{c.outcome}</span>
                )}
                {c.followUp && (
                  <span className="tag">{formatDueLabel(c.followUp)}</span>
                )}
              </div>
            )}
            <div className="checkin-reasons">
              {c.reasons.length > 0 && (
                <div className="tag-row">
                  {c.reasons.map((r) => (
                    <span key={r} className="tag tag-reason">{r}</span>
                  ))}
                </div>
              )}
              {c.reasonNotes && (
                <p className="checkin-notes">{c.reasonNotes}</p>
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
    <div className="log-layout">
      <div className="log-form-col">
        <CheckInForm
          roster={roster}
          recentPeriods={recentPeriods}
          reasonOrder={reasonOrder}
          todayNames={todayNames}
          onSaved={() => onChanged("Check-in saved")}
        />
      </div>
      <div className="log-list-col">
        <TodayList checkIns={todayCheckIns} onDelete={() => onChanged()} />
      </div>
    </div>
  );
}
