import { useEffect, useMemo, useState } from "react";
import {
  GRADES,
  DEFAULT_GRADE,
  type DebriefSettings,
  type GroupMember,
  type GroupSession,
} from "./types";
import {
  formatDayLabel,
  getOrCreateSession,
  saveGroupMembers,
  saveSession,
  todayKey,
} from "./storage";
import { normalizeName, type StudentProfile } from "./roster";

function MemberManager({
  groupName,
  members,
  roster,
  onChange,
}: {
  groupName: string;
  members: GroupMember[];
  roster: StudentProfile[];
  onChange: (members: GroupMember[]) => void;
}) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(DEFAULT_GRADE);
  const [error, setError] = useState("");

  const memberKeys = useMemo(
    () => new Set(members.map((m) => normalizeName(m.name))),
    [members],
  );

  /** Students already in the check-in log are the likeliest members to add. */
  const candidates = useMemo(
    () => roster.filter((s) => !memberKeys.has(normalizeName(s.name))).slice(0, 6),
    [roster, memberKeys],
  );

  const add = (member: GroupMember) => {
    if (!member.name.trim()) {
      setError("Enter a student name.");
      return;
    }
    if (memberKeys.has(normalizeName(member.name))) {
      setError(`${member.name.trim()} is already on the roster.`);
      return;
    }
    setError("");
    onChange([...members, { name: member.name.trim(), grade: member.grade }]);
    setName("");
  };

  return (
    <div className="card">
      <h2>{groupName} roster</h2>

      {candidates.length > 0 && (
        <div className="field">
          <label id="add-from-log-label">Add from your check-in log</label>
          <div
            className="pill-row"
            role="group"
            aria-labelledby="add-from-log-label"
          >
            {candidates.map((s) => (
              <button
                key={s.name}
                type="button"
                className="pill"
                onClick={() => add({ name: s.name, grade: s.grade })}
              >
                + {s.name}
                <span className="pill-meta">Gr {s.grade}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          add({ name, grade });
        }}
      >
        <div className="row-2">
          <div className="field">
            <label htmlFor="memberName">Add a student</label>
            <input
              id="memberName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Andre Bell"
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="memberGrade">Grade</label>
            <select
              id="memberGrade"
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
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-secondary">
          Add to roster
        </button>
      </form>

      {members.length > 0 && (
        <ul className="checkin-list" aria-label={`${groupName} members`}>
          {members.map((m) => (
            <li key={m.name} className="checkin-item">
              <div className="checkin-item-header">
                <h3>
                  {m.name}{" "}
                  <span className="pill-meta">Grade {m.grade}</span>
                </h3>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    onChange(
                      members.filter(
                        (x) => normalizeName(x.name) !== normalizeName(m.name),
                      ),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function GroupTab({
  settings,
  members,
  sessions,
  roster,
  onChanged,
}: {
  settings: DebriefSettings;
  members: GroupMember[];
  sessions: GroupSession[];
  roster: StudentProfile[];
  onChanged: (message?: string) => void;
}) {
  const groupName = settings.groupName.trim() || "Group";
  const [session, setSession] = useState<GroupSession>(() =>
    getOrCreateSession(todayKey()),
  );
  const [showRoster, setShowRoster] = useState(false);

  useEffect(() => {
    setSession(getOrCreateSession(todayKey()));
  }, [sessions]);

  const signedIn = useMemo(
    () => new Set(session.attendees.map(normalizeName)),
    [session.attendees],
  );

  const persist = (next: GroupSession, message?: string) => {
    setSession(saveSession(next));
    onChanged(message);
  };

  const toggleAttendance = (member: GroupMember) => {
    const key = normalizeName(member.name);
    const attendees = signedIn.has(key)
      ? session.attendees.filter((a) => normalizeName(a) !== key)
      : [...session.attendees, member.name];
    persist({ ...session, attendees });
  };

  const pastSessions = useMemo(
    () =>
      [...sessions]
        .filter((s) => s.date !== session.date)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [sessions, session.date],
  );

  return (
    <>
      <div className="card">
        <h2>{groupName} sign-in</h2>
        <p className="hint" style={{ marginBottom: "1rem" }}>
          {formatDayLabel(session.date)} · {session.attendees.length} of{" "}
          {members.length} signed in
        </p>

        <div className="field">
          <label htmlFor="sessionTopic">Today&apos;s focus</label>
          <input
            id="sessionTopic"
            value={session.topic}
            onChange={(e) => persist({ ...session, topic: e.target.value })}
            placeholder="e.g. Goal setting, conflict resolution"
            autoComplete="off"
          />
        </div>

        {members.length === 0 ? (
          <p className="empty-state">
            No members yet. Add students to the roster below, then tap their
            name to sign them in.
          </p>
        ) : (
          <div className="field">
            <label id="signin-label">Tap a name to sign in</label>
            <div
              className="pill-row"
              role="group"
              aria-labelledby="signin-label"
            >
              {members.map((m) => {
                const present = signedIn.has(normalizeName(m.name));
                return (
                  <button
                    key={m.name}
                    type="button"
                    className={`pill ${present ? "pill-active" : ""}`}
                    aria-pressed={present}
                    onClick={() => toggleAttendance(m)}
                  >
                    {present ? "✓ " : ""}
                    {m.name}
                    <span className="pill-meta">Gr {m.grade}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="sessionNotes">Session notes (optional)</label>
          <textarea
            id="sessionNotes"
            rows={2}
            value={session.notes}
            onChange={(e) => persist({ ...session, notes: e.target.value })}
            placeholder="What the group worked on, follow-ups…"
          />
        </div>

        <div className="btn-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowRoster((v) => !v)}
          >
            {showRoster ? "Hide roster" : "Manage roster"}
          </button>
        </div>
        <p className="hint">
          Sign-ins save as you tap. Today&apos;s session is included in the
          end-of-day debrief.
        </p>
      </div>

      {showRoster && (
        <MemberManager
          groupName={groupName}
          members={members}
          roster={roster}
          onChange={(next) => {
            saveGroupMembers(next);
            onChanged();
          }}
        />
      )}

      {pastSessions.length > 0 && (
        <div className="card">
          <h2>Recent sessions</h2>
          <ul className="checkin-list" aria-label="Recent group sessions">
            {pastSessions.map((s) => (
              <li key={s.id} className="checkin-item">
                <h3>{formatDayLabel(s.date)}</h3>
                <p className="checkin-meta">
                  {s.attendees.length} signed in
                  {s.topic ? ` · ${s.topic}` : ""}
                </p>
                {s.attendees.length > 0 && (
                  <p className="checkin-reasons">{s.attendees.join(" · ")}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
