import type { HudModuleId } from "./hudModules";

/** Specialists on Iris's team — they report to Iris; Iris reports to E. */
export type IrisSpecialistId = "scout" | "scribe" | "navigator" | "sentinel" | "quartermaster" | "curator";

export interface IrisSpecialistDef {
  id: IrisSpecialistId;
  /** Call sign */
  name: string;
  title: string;
  /** When Iris should delegate */
  delegateWhen: string;
  module: HudModuleId;
  color: string;
}

export const IRIS_CAPTAIN = {
  name: "Iris",
  title: "Chief of staff",
  reportsTo: "E",
} as const;

export const IRIS_TEAM: IrisSpecialistDef[] = [
  {
    id: "scout",
    name: "Scout",
    title: "Business research",
    delegateWhen: "market, competitors, grants, sourced briefs, deep web research",
    module: "research",
    color: "#fdba74",
  },
  {
    id: "scribe",
    name: "Scribe",
    title: "Drafts & channels",
    delegateWhen: "email drafts, brand voice, approve-and-send workflow",
    module: "channels",
    color: "#fca5a5",
  },
  {
    id: "navigator",
    name: "Navigator",
    title: "Plan & handoffs",
    delegateWhen: "weekly plan, goals, ECS handoffs, what to do this month",
    module: "plan",
    color: "#86efac",
  },
  {
    id: "sentinel",
    name: "Sentinel",
    title: "Pulse & commute",
    delegateWhen: "weather, Bay Area pulse alerts, quakes, fires, flights map, leave-by",
    module: "vitals",
    color: "#67e8f9",
  },
  {
    id: "quartermaster",
    name: "Quartermaster",
    title: "Meals & shopping",
    delegateWhen: "grocery list, meal prep, pantry",
    module: "meal",
    color: "#5eead4",
  },
  {
    id: "curator",
    name: "Curator",
    title: "Hub & memos",
    delegateWhen: "memos, gym log, watch lists, routines in Hub",
    module: "hub",
    color: "#f0abfc",
  },
];

export const IRIS_SPECIALIST_IDS = IRIS_TEAM.map((s) => s.id);

export function specialistById(id: string): IrisSpecialistDef | undefined {
  return IRIS_TEAM.find((s) => s.id === id);
}

export function isIrisSpecialistId(id: string): id is IrisSpecialistId {
  return (IRIS_SPECIALIST_IDS as string[]).includes(id);
}

/** Compact roster for Iris's system prompt. */
export function teamContextForIris(): string {
  const lines = IRIS_TEAM.map((s) => `${s.id} (${s.name}): ${s.delegateWhen}`).join("; ");
  return `Your team reports to you; you report to E. Delegate with consult_specialist when the job fits a specialist — not for one-line answers already in Right now. Roster: ${lines}. After they report back, tell E who helped in one short phrase, then the answer in spoken form (no markdown).`;
}

export function specialistLabel(id: IrisSpecialistId): string {
  return specialistById(id)?.name ?? id;
}
