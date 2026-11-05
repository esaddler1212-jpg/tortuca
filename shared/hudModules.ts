/** IRIS HUD modules — bottom tabs, corner gauges, and Iris `open_module`. */

export type HudModuleId =
  | "vitals"
  | "apps"
  | "today"
  | "inbox"
  | "plan"
  | "hub"
  | "research"
  | "meal"
  | "channels"
  | "team"
  | "ecs";

export interface HudModuleDef {
  id: HudModuleId;
  label: string;
  short: string;
  /** Hint for Iris when choosing open_module */
  hint: string;
  color: string;
}

export const HUD_MODULES: HudModuleDef[] = [
  { id: "vitals", label: "Vitals", short: "Vitals", hint: "weather, fitness, Bay Area Pulse map (quakes, fires, flights, ISS, ships)", color: "#67e8f9" },
  { id: "apps", label: "Woodhouse", short: "Apps", hint: "connected apps and sync status", color: "#a5b4fc" },
  { id: "team", label: "Team", short: "Team", hint: "Iris specialists roster, org chart, who reports to Iris", color: "#38bdf8" },
  { id: "today", label: "Today", short: "Today", hint: "do today, schedule, todos, leave-by", color: "#fde047" },
  { id: "inbox", label: "Inbox", short: "Inbox", hint: "newest Gmail, unread mail", color: "#fda4af" },
  { id: "plan", label: "Plan", short: "Plan", hint: "weekly plan, goals, handoffs", color: "#86efac" },
  { id: "hub", label: "Hub", short: "Hub", hint: "memos, gym, watch, routines", color: "#f0abfc" },
  { id: "research", label: "Research", short: "R&D", hint: "business researcher briefs", color: "#fdba74" },
  { id: "meal", label: "Meals", short: "Meals", hint: "shopping list and meal prep", color: "#5eead4" },
  { id: "channels", label: "Drafts", short: "Drafts", hint: "draft email by brand, approve send", color: "#fca5a5" },
  { id: "ecs", label: "ECS log", short: "ECS", hint: "roadmap, timeline, messages log", color: "#c4b5fd" },
];

export const HUD_MODULE_IDS = HUD_MODULES.map((m) => m.id);

/** Primary bottom tab bar; everything else is under More. */
export const HUD_TABS: HudModuleId[] = ["today", "vitals", "inbox", "plan"];
export const HUD_MORE: HudModuleId[] = HUD_MODULE_IDS.filter((id) => !HUD_TABS.includes(id));

export function moduleContextForIris(): string {
  return HUD_MODULES.map((m) => `${m.id}: ${m.hint}`).join("; ");
}

export function isHudModuleId(id: string): id is HudModuleId {
  return (HUD_MODULE_IDS as string[]).includes(id);
}

export function moduleLabel(id: HudModuleId): string {
  return HUD_MODULES.find((m) => m.id === id)?.label ?? id;
}

/** Client-side fallback when Iris didn't call open_module. */
export function matchModuleFromSpeech(text: string): HudModuleId | null {
  const t = text.toLowerCase();
  if (/\b(team|specialist|scout|scribe|navigator|sentinel|quartermaster|curator)\b/.test(t)) return "team";
  if (/\b(channel|draft|write an? email|compose)\b/.test(t)) return "channels";
  if (/\b(inbox|email|e-mail|mail|gmail|unread)\b/.test(t)) return "inbox";
  if (/\b(research|brief me on|market)\b/.test(t)) return "research";
  if (/\b(plan|goal|handoff|week)\b/.test(t) && !/\btoday\b/.test(t)) return "plan";
  if (/\b(hub|memo|gym|watch|routine)\b/.test(t)) return "hub";
  if (/\b(meal|shop|grocery|pantry)\b/.test(t)) return "meal";
  if (/\b(woodhouse|apps?|network)\b/.test(t)) return "apps";
  if (/\b(vital|weather|fitness|commute|pulse|map|(?:earth)?quakes?|fires?|wildfires?|flights?|planes?|iss|ships?|air quality)\b/.test(t)) return "vitals";
  if (/\b(roadmap|ecs|log|timeline)\b/.test(t)) return "ecs";
  if (/\b(today|schedule|todo|calendar)\b/.test(t)) return "today";
  if (/\b(open|show|bring up|pull up)\b/.test(t)) return "today";
  return null;
}
