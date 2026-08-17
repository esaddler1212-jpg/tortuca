import { useCallback, useEffect, useState } from "react";
import { fetchCurriculum, joinSession, submitResponses } from "./api";
import {
  clearSession,
  loadProfile,
  loadSessionToken,
  saveProfile,
  saveSessionToken,
} from "./session";
import type { BoysCurriculumWeek, BoysGroup, BoysResponses, BoysStudent } from "./types";

function LoginScreen({
  onJoined,
}: {
  onJoined: (token: string, student: BoysStudent, group: BoysGroup) => void;
}) {
  const [step, setStep] = useState<"code" | "profile">("code");
  const [classCode, setClassCode] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("7");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      setError("Enter your class code.");
      return;
    }
    setError("");
    setStep("profile");
  };

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await joinSession(classCode, name, grade);
      saveSessionToken(result.sessionToken);
      saveProfile({
        name: result.student.name,
        grade: result.student.grade,
        groupName: result.group.name,
      });
      onJoined(result.sessionToken, result.student, result.group);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <header className="hero">
        <p className="eyebrow">Building Our Young Scholars</p>
        <h1>BOYS</h1>
        <p className="tagline">Who are we? <strong>BOYS!</strong> How do we move? <strong>With purpose!</strong></p>
      </header>

      {step === "code" ? (
        <form className="card" onSubmit={submitCode}>
          <h2>Enter your class code</h2>
          <p className="hint">Your mentor will give you a code like PURPOSE-A.</p>
          <div className="field">
            <label htmlFor="classCode">Class code</label>
            <input
              id="classCode"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              placeholder="PURPOSE-A"
              autoComplete="off"
              autoCapitalize="characters"
            />
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary">Continue</button>
        </form>
      ) : (
        <form className="card" onSubmit={(e) => void submitProfile(e)}>
          <h2>Tell us who you are</h2>
          <p className="hint">Code: <strong>{classCode.trim().toUpperCase()}</strong></p>
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First and last name"
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label htmlFor="grade">Grade</label>
            <select id="grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="6">6th grade</option>
              <option value="7">7th grade</option>
              <option value="8">8th grade</option>
            </select>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={() => setStep("code")}>
              Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Joining…" : "Start"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function LessonScreen({
  token,
  student,
  group,
  onSignOut,
}: {
  token: string;
  student: BoysStudent;
  group: BoysGroup;
  onSignOut: () => void;
}) {
  const [weekLabel, setWeekLabel] = useState("");
  const [weekNumber, setWeekNumber] = useState(0);
  const [week, setWeek] = useState<BoysCurriculumWeek | null>(null);
  const [warmUp, setWarmUp] = useState("");
  const [exitTicket, setExitTicket] = useState("");
  const [status, setStatus] = useState<BoysResponses | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState<"warmup" | "exit" | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCurriculum(token);
      setWeekLabel(data.weekLabel);
      setWeekNumber(data.weekNumber);
      setWeek(data.week);
      setWarmUp(data.responses?.warmUp ?? "");
      setExitTicket(data.responses?.exitTicket ?? "");
      setStatus(data.responses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load lesson.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const saveWarmUp = async () => {
    if (!warmUp.trim()) {
      setError("Write your warm-up response first.");
      return;
    }
    setSaving("warmup");
    setError("");
    try {
      const result = await submitResponses(token, { warmUp });
      setStatus(result.responses);
      showToast("Warm-up saved!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(null);
    }
  };

  const saveExit = async () => {
    if (!exitTicket.trim()) {
      setError("Write your exit ticket first.");
      return;
    }
    setSaving("exit");
    setError("");
    try {
      const result = await submitResponses(token, { exitTicket });
      setStatus(result.responses);
      showToast("Exit ticket saved!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(null);
    }
  };

  const gradePrompt =
    week?.gradePrompts?.[student.grade as "6" | "7" | "8"];

  if (loading) {
    return (
      <div className="card loading-card" role="status">
        Loading your lesson…
      </div>
    );
  }

  return (
    <>
      <header className="app-header">
        <div>
          <p className="eyebrow">{group.name}</p>
          <h1>{student.name} · Grade {student.grade}</h1>
          <p className="hint">Excused from period {group.period} during BOYS</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      {weekNumber === 0 ? (
        <div className="card">
          <h2>Week 1 starts next week</h2>
          <p className="hint">
            You&apos;re signed in and ready. Come back when your mentor starts the
            curriculum to complete your warm-up and exit ticket.
          </p>
          <p className="chant">Who are we? <strong>BOYS!</strong> How do we move? <strong>With purpose!</strong></p>
        </div>
      ) : week ? (
        <>
          <div className="card week-banner">
            <p className="week-label">{weekLabel}</p>
            <h2>{week.theme}: {week.subtitle}</h2>
            <div className="progress-row">
              <span className={status?.warmUpDone ? "done" : ""}>
                {status?.warmUpDone ? "✓" : "○"} Warm-up
              </span>
              <span className={status?.exitTicketDone ? "done" : ""}>
                {status?.exitTicketDone ? "✓" : "○"} Exit ticket
              </span>
            </div>
          </div>

          <div className="card">
            <h3>Warm-up</h3>
            <p className="prompt">{week.warmUpPrompt}</p>
            <textarea
              rows={4}
              value={warmUp}
              onChange={(e) => setWarmUp(e.target.value)}
              placeholder="Type your answer here…"
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving === "warmup"}
              onClick={() => void saveWarmUp()}
            >
              {saving === "warmup" ? "Saving…" : status?.warmUpDone ? "Update warm-up" : "Save warm-up"}
            </button>
          </div>

          <div className="card">
            <h3>{week.activityTitle}</h3>
            <p className="session-type">
              {week.sessionType === "socratic" ? "Socratic seminar" : "Impact activity"}
            </p>
            <p className="hint">{week.activityDescription}</p>
            {gradePrompt && (
              <p className="grade-prompt">
                <strong>Grade {student.grade} focus:</strong> {gradePrompt}
              </p>
            )}
          </div>

          <div className="card">
            <h3>Exit ticket</h3>
            <p className="prompt">{week.exitTicketPrompt}</p>
            <textarea
              rows={4}
              value={exitTicket}
              onChange={(e) => setExitTicket(e.target.value)}
              placeholder="Type your answer here…"
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving === "exit"}
              onClick={() => void saveExit()}
            >
              {saving === "exit" ? "Saving…" : status?.exitTicketDone ? "Update exit ticket" : "Save exit ticket"}
            </button>
          </div>

          <div className="card closing">
            <p className="chant">Who are we? <strong>BOYS!</strong></p>
            <p className="chant">How do we move? <strong>With purpose!</strong></p>
          </div>
        </>
      ) : (
        <div className="card">
          <h2>{weekLabel}</h2>
          <p className="hint">No lesson is available for this week.</p>
        </div>
      )}

      {error && <p className="error banner-error" role="alert">{error}</p>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => loadSessionToken());
  const [student, setStudent] = useState<BoysStudent | null>(null);
  const [group, setGroup] = useState<BoysGroup | null>(null);
  const [booting, setBooting] = useState(Boolean(loadSessionToken()));

  useEffect(() => {
    const existing = loadSessionToken();
    if (!existing) {
      setBooting(false);
      return;
    }
    void fetchCurriculum(existing)
      .then((data) => {
        setToken(existing);
        setStudent(data.student);
        if (data.group) {
          setGroup(data.group);
        } else {
          setGroup({
            id: data.student.groupId,
            name: loadProfile()?.groupName ?? "BOYS Group",
            classCode: "",
            period: "",
          });
        }
      })
      .catch(() => {
        clearSession();
        setToken(null);
      })
      .finally(() => setBooting(false));
  }, []);

  const handleJoined = (newToken: string, newStudent: BoysStudent, newGroup: BoysGroup) => {
    setToken(newToken);
    setStudent(newStudent);
    setGroup(newGroup);
  };

  const handleSignOut = () => {
    clearSession();
    setToken(null);
    setStudent(null);
    setGroup(null);
  };

  if (booting) {
    return <div className="app-shell"><div className="card loading-card">Loading…</div></div>;
  }

  return (
    <div className="app-shell">
      {!token || !student || !group ? (
        <LoginScreen onJoined={handleJoined} />
      ) : (
        <LessonScreen
          token={token}
          student={student}
          group={group}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}
