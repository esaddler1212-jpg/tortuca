import { useEffect, useState } from "react";
import type { DebriefSettings } from "./types";
import { saveDebriefSettings } from "./storage";

export default function SettingsTab({
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
      <button type="submit" className="btn btn-primary">
        Save settings
      </button>
    </form>
  );
}
