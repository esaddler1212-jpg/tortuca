import { useEffect, useRef, useState } from "react";
import type { DebriefSettings } from "./types";
import { saveDebriefSettings } from "./storage";
import {
  BackupError,
  downloadBackup,
  parseBackup,
  restoreBackup,
} from "./backup";
import SchoolScheduleCard from "./SchoolScheduleCard";

function DataBackup({ onRestored }: { onRestored: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const restore = async (file: File) => {
    setError("");
    setMessage("");
    try {
      const backup = parseBackup(await file.text());
      restoreBackup(backup);
      setMessage(
        `Restored ${backup.checkIns.length} check-ins and ${backup.groupSessions.length} group sessions.`,
      );
      onRestored();
    } catch (e) {
      setError(
        e instanceof BackupError ? e.message : "That backup could not be read.",
      );
    }
  };

  return (
    <div className="card">
      <h2>Data backup</h2>
      <p className="hint" style={{ marginBottom: "1rem" }}>
        Check-ins live in this browser only. Save a backup regularly so the
        record survives a cleared browser or a new device — and so the data is
        available later for impact reporting.
      </p>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => downloadBackup()}
        >
          Download backup (JSON)
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileInput.current?.click()}
        >
          Restore from backup
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        aria-label="Backup file"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void restore(file);
          e.target.value = "";
        }}
      />
      {message && <p className="hint">{message}</p>}
      {error && (
        <p style={{ color: "var(--danger)", marginTop: "0.5rem" }}>{error}</p>
      )}
      <p className="hint">Restoring replaces the data currently on this device.</p>
    </div>
  );
}

export default function SettingsTab({
  settings,
  onSave,
  onRestored,
}: {
  settings: DebriefSettings;
  onSave: (s: DebriefSettings) => void;
  onRestored: () => void;
}) {
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const update = (key: keyof DebriefSettings, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  return (
    <>
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
        These appear on your daily debrief and reports, and pre-fill email
        recipients.
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
        <label htmlFor="groupName">Group name</label>
        <input
          id="groupName"
          value={form.groupName}
          onChange={(e) => update("groupName", e.target.value)}
          placeholder="e.g. BOYS Group"
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
      <div className="field">
        <label htmlFor="attendanceEmail">Attendance clerk email</label>
        <input
          id="attendanceEmail"
          type="email"
          value={form.attendanceEmail}
          onChange={(e) => update("attendanceEmail", e.target.value)}
          placeholder="attendance@school.edu"
        />
      </div>
      <div className="field">
        <label htmlFor="careTeamEmail">CARE team email</label>
        <input
          id="careTeamEmail"
          type="email"
          value={form.careTeamEmail}
          onChange={(e) => update("careTeamEmail", e.target.value)}
          placeholder="careteam@school.edu"
        />
        <p className="hint">
          CARE team referrals go here and nowhere else.
        </p>
      </div>
      <button type="submit" className="btn btn-primary">
        Save settings
      </button>
    </form>
    <SchoolScheduleCard />
    <DataBackup onRestored={onRestored} />
    </>
  );
}
