import { useEffect, useRef, useState } from "react";
import type { DebriefSettings } from "./types";
import { saveDebriefSettings } from "./storage";
import {
  BackupError,
  downloadBackup,
  parseBackup,
  restoreBackup,
} from "./backup";
import {
  formatLastBackupLabel,
  loadBackupState,
  needsBackup,
} from "./autoBackup";
import SchoolScheduleCard from "./SchoolScheduleCard";
import { DeviceSyncHint, SyncNowButton } from "./DeviceSync";

function DataBackup({ onRestored }: { onRestored: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lastBackup = formatLastBackupLabel(loadBackupState());
  const pending = needsBackup();

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
      <p className="hint hint-block">
        Check-ins live on this Chromebook. Install the app once while you have
        internet, then log students all day offline. When your hotspot connects,
        new data backs up automatically (see Offline &amp; auto-backup below).
      </p>
      {pending && (
        <p className="hint hint-block">
          <strong>Not backed up yet</strong> — connect to the internet or tap
          Download backup below.
        </p>
      )}
      {lastBackup && (
        <p className="hint hint-block">{lastBackup}</p>
      )}
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
        className="hidden-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void restore(file);
          e.target.value = "";
        }}
      />
      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <p className="hint">Restoring replaces the data currently on this device.</p>
    </div>
  );
}

export default function SettingsTab({
  settings,
  onSave,
  onRestored,
  onSynced,
}: {
  settings: DebriefSettings;
  onSave: (s: DebriefSettings) => void;
  onRestored: () => void;
  onSynced: () => void;
}) {
  const [form, setForm] = useState(settings);
  const [syncNote, setSyncNote] = useState("");

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const update = (key: keyof DebriefSettings, value: string | boolean) => {
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
      <p className="hint hint-block">
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
      <h3>Offline &amp; auto-backup</h3>
      <p className="hint hint-block">
        At school without Wi‑Fi, the app keeps working after you open it once
        with internet. Turn on your phone hotspot later and new check-ins back up
        on their own — usually as a file in Downloads, or to a URL if Family
        Purpose gives you one.
      </p>
      <div className="field">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.autoBackupEnabled}
            onChange={(e) => update("autoBackupEnabled", e.target.checked)}
          />
          <span>Back up automatically when the internet comes back</span>
        </label>
      </div>
      <div className="field">
        <label htmlFor="deviceLabel">This Chromebook (optional)</label>
        <input
          id="deviceLabel"
          value={form.deviceLabel}
          onChange={(e) => update("deviceLabel", e.target.value)}
          placeholder="e.g. Jordan work Chromebook"
        />
      </div>
      <div className="field">
        <label htmlFor="backupUploadUrl">Backup upload URL (optional)</label>
        <input
          id="backupUploadUrl"
          type="url"
          value={form.backupUploadUrl}
          onChange={(e) => update("backupUploadUrl", e.target.value)}
          placeholder="https://your-site.netlify.app/api/family-purpose-backup"
        />
        <p className="hint">
          Leave blank to save a JSON file to Downloads when you are online. If
          Family Purpose hosts a backup endpoint, paste it here instead.
        </p>
      </div>
      <div className="field">
        <label htmlFor="backupUploadKey">Backup upload key (optional)</label>
        <input
          id="backupUploadKey"
          type="password"
          value={form.backupUploadKey}
          onChange={(e) => update("backupUploadKey", e.target.value)}
          placeholder="Only if your upload URL requires a key"
          autoComplete="off"
        />
      </div>
      <button type="submit" className="btn btn-primary btn-block">
        Save settings
      </button>
    </form>
    <SchoolScheduleCard />
    <DataBackup onRestored={onRestored} />
    <div className="card">
      <h2>Sync across devices</h2>
      <DeviceSyncHint settings={form} />
      <div className="btn-row section-actions">
        <SyncNowButton
          settings={form}
          onMessage={setSyncNote}
          onDataChange={onSynced}
        />
      </div>
      {syncNote && <p className="hint">{syncNote}</p>}
      <p className="hint">
        Label each device in Offline &amp; auto-backup (e.g. &quot;Work laptop&quot;,
        &quot;My phone&quot;) so backups in the cloud stay separate until they merge.
      </p>
    </div>
    </>
  );
}
