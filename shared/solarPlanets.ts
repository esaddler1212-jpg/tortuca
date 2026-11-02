/** IRIS solar system — each console module is a planet orbiting Iris (the sun). */

export type SolarPlanetId =
  | "vitals"
  | "apps"
  | "today"
  | "plan"
  | "hub"
  | "research"
  | "meal"
  | "channels"
  | "ecs";

export interface SolarPlanetDef {
  id: SolarPlanetId;
  label: string;
  short: string;
  /** Hint for Iris when choosing open_planet */
  hint: string;
  color: string;
}

export const SOLAR_PLANETS: SolarPlanetDef[] = [
  { id: "vitals", label: "Vitals", short: "Vitals", hint: "weather, fitness, leave-by", color: "#67e8f9" },
  { id: "apps", label: "Woodhouse", short: "Apps", hint: "connected apps and sync status", color: "#a5b4fc" },
  { id: "today", label: "Today", short: "Today", hint: "do today, schedule, email, todos", color: "#fde047" },
  { id: "plan", label: "Plan", short: "Plan", hint: "weekly plan, goals, handoffs", color: "#86efac" },
  { id: "hub", label: "Hub", short: "Hub", hint: "memos, gym, watch, routines", color: "#f0abfc" },
  { id: "research", label: "Research", short: "R&D", hint: "business researcher briefs", color: "#fdba74" },
  { id: "meal", label: "Meals", short: "Meals", hint: "shopping list and meal prep", color: "#5eead4" },
  { id: "channels", label: "Channels", short: "Mail", hint: "draft email by brand, approve send", color: "#fca5a5" },
  { id: "ecs", label: "ECS log", short: "ECS", hint: "roadmap, timeline, messages log", color: "#c4b5fd" },
];

export const SOLAR_PLANET_IDS = SOLAR_PLANETS.map((p) => p.id);

export function solarPlanetContextForIris(): string {
  return SOLAR_PLANETS.map((p) => `${p.id}: ${p.hint}`).join("; ");
}

export function isSolarPlanetId(id: string): id is SolarPlanetId {
  return (SOLAR_PLANET_IDS as string[]).includes(id);
}

/** Degrees to rotate orbit so this planet sits at the front (6 o'clock). */
export function orbitSpinToFront(planetId: SolarPlanetId, count = SOLAR_PLANETS.length): number {
  const idx = SOLAR_PLANETS.findIndex((p) => p.id === planetId);
  if (idx < 0) return 0;
  const slot = (360 / count) * idx;
  return 180 - slot;
}

/** Client-side fallback when Iris didn't call open_planet. */
export function matchPlanetFromSpeech(text: string): SolarPlanetId | null {
  const t = text.toLowerCase();
  if (/\b(channel|email|mail|draft)\b/.test(t)) return "channels";
  if (/\b(research|brief me on|market)\b/.test(t)) return "research";
  if (/\b(plan|goal|handoff|week)\b/.test(t) && !/\btoday\b/.test(t)) return "plan";
  if (/\b(hub|memo|gym|watch|routine)\b/.test(t)) return "hub";
  if (/\b(meal|shop|grocery|pantry)\b/.test(t)) return "meal";
  if (/\b(woodhouse|apps?|network)\b/.test(t)) return "apps";
  if (/\b(vital|weather|fitness|commute)\b/.test(t)) return "vitals";
  if (/\b(roadmap|ecs|log|timeline)\b/.test(t)) return "ecs";
  if (/\b(today|schedule|todo|calendar|inbox)\b/.test(t)) return "today";
  if (/\b(open|show|bring up|pull up)\b/.test(t)) return "today";
  return null;
}
