import type { DebriefSettings } from "./types";
import { loadBackupState } from "./autoBackup";

export type SetupStatusLevel = "ok" | "warn" | "off";

export interface SetupStatusItem {
  id: string;
  label: string;
  detail: string;
  level: SetupStatusLevel;
}

/** Read-only checklist for Settings — no network calls. */
export function buildSetupStatus(settings: DebriefSettings): SetupStatusItem[] {
  const url = settings.backupUploadUrl.trim();
  const key = settings.backupUploadKey.trim();
  const cloudLinked = Boolean(url && key);
  const cloudPartial = Boolean(url !== key && (url || key));

  const items: SetupStatusItem[] = [
    {
      id: "cloud",
      label: "Phone + laptop sync",
      detail: cloudLinked
        ? "Upload URL and key are set — sync runs when you are online."
        : cloudPartial
          ? "Add both upload URL and key (Netlify + Settings must match)."
          : "Optional: paste Netlify backup URL + key on every device you use.",
      level: cloudLinked ? "ok" : cloudPartial ? "warn" : "off",
    },
    {
      id: "boys-code",
      label: "BOYS class code",
      detail: settings.boysClassCode.trim()
        ? `Students use ${settings.boysClassCode.trim().toUpperCase()} on the student app.`
        : "Set PURPOSE-A, B, or C so Group shows curriculum completion.",
      level: settings.boysClassCode.trim() ? "ok" : "warn",
    },
    {
      id: "debrief-email",
      label: "Debrief recipients",
      detail:
        settings.staffEmail.trim() || settings.companyEmail.trim()
          ? "Daily debrief emails are pre-filled."
          : "Add school staff or program email in Debrief & profile.",
      level: settings.staffEmail.trim() || settings.companyEmail.trim() ? "ok" : "warn",
    },
    {
      id: "backup",
      label: "Last backup",
      detail: (() => {
        const st = loadBackupState();
        if (!st?.backedUpAt) return "No backup recorded yet — use Download or wait for 2:30 PM Pacific.";
        const when = new Date(st.backedUpAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });
        return `${st.method === "upload" ? "Cloud" : "Download"} · ${when}`;
      })(),
      level: loadBackupState()?.backedUpAt ? "ok" : "warn",
    },
  ];

  return items;
}
