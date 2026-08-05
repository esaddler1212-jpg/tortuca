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
  formatNextBackupHint,
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
        Automatic backup runs once daily at 2:30 PM Pacific — not on every app
        open. Use the buttons below anytime for a manual copy.
      </p>
      <p className="hint hint-block">{formatNextBackupHint()}</p>
      {pending && (
        <p className="hint hint-block">
          <strong>New check-ins not in today&apos;s backup yet</strong> — they
          will be included at 2:30 PM Pacific or when you download manually.
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
      <h3>Offline &amp; daily backup</h3>
      <p className="hint hint-block">
        The app works offline after you open it once with internet. Check-ins
        from your phone sync in the background when you open the app. A full
        backup runs once per day at <strong>2:30 PM Pacific</strong> (not every
        time you open the app).
      </p>
      <div className="field">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.autoBackupEnabled}
            onChange={(e) => update("autoBackupEnabled", e.target.checked)}
          />
          <span>Daily backup at 2:30 PM Pacific (when online)</span>
        </label>
      </div>
      <div className="field">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.backupSaveToDownloads}
            onChange={(e) => update("backupSaveToDownloads", e.target.checked)}
          />
          <span>Save backup file to Downloads (Chromebook — turn off on phone)</span>
        </label>
      </div>
      <div className="field">
        <label htmlFor="deviceLabel">This device (optional)</label>
        <input
          id="deviceLabel"
          value={form.deviceLabel}
          onChange={(e) => update("deviceLabel", e.target.value)}
          placeholder="e.g. Work Chromebook or My phone"
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
          Phone + laptop: paste your Netlify backup URL on both devices. Cloud
          sync happens when you open the app; upload runs at 2:30 PM Pacific.
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
