/** Iris talking-orb skins — device-local via HudPrefs.irisOrbStyle */

export const IRIS_ORB_STYLES = [
  {
    id: "ops-console",
    label: "Ops console",
    blurb: "Classic ring plus live captions, ask budget, and four in-ring module shortcuts (default).",
  },
  {
    id: "classic",
    label: "Classic reactor",
    blurb: "Original cyan core ring — minimal chrome, tap center to talk.",
  },
  {
    id: "filament",
    label: "K.A.R.A. filament",
    blurb: "Warm filament canvas orb (same as combo HUD K.A.R.A. skin).",
  },
  {
    id: "waveform-arc",
    label: "Waveform arc",
    blurb: "Oscilloscope bars hug the lower arc while she listens or speaks.",
  },
  {
    id: "sonar",
    label: "Sonar pulse",
    blurb: "Listening mode emphasizes expanding sonar rings; calm when idle.",
  },
  {
    id: "cinema-eye",
    label: "Cinema eye",
    blurb: "Iron Man–style horizontal eye from the voice dock, scaled into the core.",
  },
  {
    id: "lantern",
    label: "Lantern gold",
    blurb: "Alfred gold accents — same mechanics, softer executive look.",
  },
  {
    id: "status-cross",
    label: "Status cross",
    blurb: "Bold N/E/S/W badges for inbox, today, vitals, and plan counts.",
  },
  {
    id: "team-roster",
    label: "Team roster",
    blurb: "Shows the last specialist Iris delegated to around the ring.",
  },
  {
    id: "capsule",
    label: "Capsule chip",
    blurb: "Compact pill for tight layouts (voice dock); full core falls back to classic.",
  },
] as const;

export type IrisOrbStyleId = (typeof IRIS_ORB_STYLES)[number]["id"];

export const DEFAULT_IRIS_ORB_STYLE: IrisOrbStyleId = "cinema-eye";

export function isIrisOrbStyleId(raw: string): raw is IrisOrbStyleId {
  return IRIS_ORB_STYLES.some((s) => s.id === raw);
}