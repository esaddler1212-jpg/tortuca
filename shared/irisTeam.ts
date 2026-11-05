import type { HudModuleId } from "./hudModules";
import { HUD_MODULE_IDS } from "./hudModules";

/** Specialists on Iris's team — one owner per HUD module (except Team). They report to Iris; Iris reports to E. */
export type IrisSpecialistId =
  | "ledger"
  | "courier"
  | "sentinel"
  | "navigator"
  | "wire"
  | "curator"
  | "scout"
  | "quartermaster"
  | "scribe"
  | "archivist"
  | "woodhouse";

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

/** One specialist per HUD module — Iris consults them and relays findings to E. */
export const IRIS_TEAM: IrisSpecialistDef[] = [
  {
    id: "ledger",
    name: "Ledger",
    title: "Today & schedule",
    delegateWhen: "do today, todos, urgent items, leave-by, today's timeline, spark",
    module: "today",
    color: "#fde047",
  },
  {
    id: "courier",
    name: "Courier",
    title: "Inbox triage",
    delegateWhen: "unread mail, senders, what needs a reply, inbox summary",
    module: "inbox",
    color: "#fda4af",
  },
  {
    id: "sentinel",
    name: "Sentinel",
    title: "Pulse & commute",
    delegateWhen: "weather, Bay Area pulse alerts, quakes, fires, flights map, leave-by, fitness",
    module: "vitals",
    color: "#67e8f9",
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
    id: "wire",
    name: "Wire",
    title: "Apps & sync",
    delegateWhen: "connected apps, sync status, Woodhouse nodes, network health",
    module: "apps",
    color: "#a5b4fc",
  },
  {
    id: "curator",
    name: "Curator",
    title: "Hub & memos",
    delegateWhen: "memos, gym log, watch lists, routines in Hub",
    module: "hub",
    color: "#f0abfc",
  },
  {
    id: "scout",
    name: "Scout",
    title: "Business research",
    delegateWhen: "market, competitors, grants, sourced briefs, deep web research",
    module: "research",
    color: "#fdba74",
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
    id: "scribe",
    name: "Scribe",
    title: "Drafts & channels",
    delegateWhen: "email drafts, brand voice, approve-and-send workflow",
    module: "channels",
    color: "#fca5a5",
  },
  {
    id: "archivist",
    name: "Archivist",
    title: "ECS log & roadmap",
    delegateWhen: "roadmap, timeline, ECS ops log, project history",
    module: "ecs",
    color: "#c4b5fd",
  },
  {
    id: "woodhouse",
    name: "Woodhouse",
    title: "Team ops & efficiency",
    delegateWhen: "specialist workload, duplicate delegates, who already handled this, team roster efficiency",
    module: "team",
    color: "#38bdf8",
  },
];

export const IRIS_SPECIALIST_IDS = IRIS_TEAM.map((s) => s.id);

const MODULES_WITH_SPECIALISTS = HUD_MODULE_IDS;

export function specialistById(id: string): IrisSpecialistDef | undefined {
  return IRIS_TEAM.find((s) => s.id === id);
}

export function specialistForModule(module: HudModuleId): IrisSpecialistDef | undefined {
  return IRIS_TEAM.find((s) => s.module === module);
}

export function isIrisSpecialistId(id: string): id is IrisSpecialistId {
  return (IRIS_SPECIALIST_IDS as string[]).includes(id);
}

/** Compact roster for Iris's system prompt. */
export function teamContextForIris(): string {
  const owners = IRIS_TEAM.map((s) => `${s.module}→${s.id} (${s.name})`).join(", ");
  const roster = IRIS_TEAM.map((s) => `${s.id} (${s.name}, ${s.module}): ${s.delegateWhen}`).join("; ");
  return (
    `Each IRIS module has one specialist who owns that work; you are E's only voice out. ` +
    `When E asks about a module's domain, call consult_specialist for the owner (module map: ${owners}) — don't redo their job yourself. ` +
    `They return findings; you relay who helped in one short phrase, then their summary in spoken form (no markdown). ` +
    `Skip delegation for one-line facts already in Right now. Roster: ${roster}.`
  );
}

export function specialistLabel(id: IrisSpecialistId): string {
  return specialistById(id)?.name ?? id;
}

/** Every HUD module has exactly one specialist. */
export function teamCoverageOk(): boolean {
  if (IRIS_TEAM.length !== MODULES_WITH_SPECIALISTS.length) return false;
  const modules = new Set(IRIS_TEAM.map((s) => s.module));
  return MODULES_WITH_SPECIALISTS.every((id) => modules.has(id));
}
