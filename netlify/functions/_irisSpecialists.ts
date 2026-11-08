import type Anthropic from "@anthropic-ai/sdk";
import {
  type IrisSpecialistId,
  IRIS_TEAM,
  specialistById,
} from "../../shared/irisTeam";
import {
  duplicateBlockedMessage,
  findDuplicateDelegate,
  findOverlappingDelegate,
  teamEfficiencySummary,
  type IrisDelegateLog,
} from "../../shared/irisTeamActivity";
import {
  RESEARCH_DAILY_LIMIT,
  RESEARCH_MIN_QUERY_CHARS,
  sanitizeDelegateTask,
  sanitizeResearchQuery,
} from "../../shared/agentGuardrails";
import { runBusinessResearch } from "./_businessResearch";
import { createScribeDraft } from "./_scribeDraft";
import { resolveDataKey } from "./_userData";
import {
  appendHubMemo,
  incrementResearchUsage,
  researchUsageCount,
} from "./_researchMemo";

export interface SpecialistConsultResult {
  specialist: IrisSpecialistId;
  summary: string;
  module: string | null;
  memoSaved: boolean;
  deduped?: boolean;
}

/** The module registry line names every domain's keywords, so it would match every specialist. */
const REGISTRY_LINE = /^IRIS modules \(open with open_module\):/;

/** Context lines in a specialist's domain, or null when none are on file. */
export function specialistExcerpt(context: string, keywords: RegExp, max = 1200): string | null {
  const block = context
    .split("\n")
    .filter((l) => l.trim() && !REGISTRY_LINE.test(l) && keywords.test(l))
    .join("\n")
    .trim();
  return block ? block.slice(0, max) : null;
}

function excerptContext(context: string, keywords: RegExp, max = 1200): string {
  return specialistExcerpt(context, keywords, max) ?? "nothing on file right now for this; E can open the module to check directly";
}

function voiceSummaryFromReport(report: string, max = 900): string {
  const flat = report
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{2,}/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}

export async function consultSpecialist(
  client: Anthropic,
  input: {
    specialist: IrisSpecialistId;
    task: string;
    query?: string;
    context: string;
    sessionId: string;
    who: string;
    timeZone: string;
    area?: string;
    delegateHistory?: IrisDelegateLog[];
    sessionEmail?: string;
  },
): Promise<SpecialistConsultResult> {
  const def = specialistById(input.specialist);
  if (!def) {
    return {
      specialist: input.specialist,
      summary: "Unknown specialist id.",
      module: null,
      memoSaved: false,
    };
  }

  const task = sanitizeDelegateTask(input.task);
  if (!task) {
    return { specialist: input.specialist, summary: "Need a clear task for the team.", module: def.module, memoSaved: false };
  }

  const history = input.delegateHistory ?? [];
  if (input.specialist !== "woodhouse") {
    const prior = findDuplicateDelegate(history, input.specialist, task);
    if (prior) {
      return {
        specialist: input.specialist,
        summary: duplicateBlockedMessage(prior, input.timeZone, false),
        module: def.module,
        memoSaved: false,
        deduped: true,
      };
    }
    const overlap = findOverlappingDelegate(history, task, input.specialist);
    if (overlap) {
      return {
        specialist: overlap.specialist,
        summary: duplicateBlockedMessage(overlap, input.timeZone, true),
        module: specialistById(overlap.specialist)?.module ?? def.module,
        memoSaved: false,
        deduped: true,
      };
    }
  }

  switch (input.specialist) {
    case "scout": {
      const query = sanitizeResearchQuery(input.query?.trim() || task);
      if (query.length < RESEARCH_MIN_QUERY_CHARS) {
        return {
          specialist: "scout",
          summary: "Scout needs a sharper research question (at least a few words).",
          module: "research",
          memoSaved: false,
        };
      }
      const used = await researchUsageCount(input.who, input.timeZone);
      if (used >= RESEARCH_DAILY_LIMIT) {
        return {
          specialist: "scout",
          summary: `Scout is at the daily research cap (${RESEARCH_DAILY_LIMIT}). Try a narrower ask tomorrow or use the Research module.`,
          module: "research",
          memoSaved: false,
        };
      }
      const area = input.area?.trim() || "General";
      const { report, searched, refused } = await runBusinessResearch(client, {
        query,
        area,
        context: "",
      });
      if (refused || !report.trim()) {
        return {
          specialist: "scout",
          summary: "Scout couldn't finish that brief — try rephrasing.",
          module: "research",
          memoSaved: false,
        };
      }
      await incrementResearchUsage(input.who, input.timeZone);
      const memoText = [
        "📊 **Scout** (via Iris)",
        `**Area:** ${area}`,
        `**Task:** ${task}`,
        searched ? "_Live web sources._" : "",
        "",
        report,
      ]
        .filter(Boolean)
        .join("\n");
      await appendHubMemo(input.sessionId, memoText, "scout");
      return {
        specialist: "scout",
        summary: `Scout saved a full brief to Hub memos. Spoken summary: ${voiceSummaryFromReport(report)}`,
        module: "research",
        memoSaved: true,
      };
    }
    case "ledger":
      return {
        specialist: "ledger",
        summary: `Ledger on Today: ${excerptContext(input.context, /\b(today|todo|task|urgent|leave|schedule|spark|timeline|event)\b/i)}`,
        module: "today",
        memoSaved: false,
      };
    case "courier":
      return {
        specialist: "courier",
        summary: `Courier on Inbox (senders and subjects only — no body text): ${excerptContext(input.context, /\b(inbox|unread|mail|gmail|sender|subject|email)\b/i)}. School and family threads stay in the app; E can open Inbox for those.`,
        module: "inbox",
        memoSaved: false,
      };
    case "scribe": {
      const key = await resolveDataKey(input.sessionId);
      const draft = await createScribeDraft(key, input.sessionEmail, task, input.context);
      return {
        specialist: "scribe",
        summary: draft.summary,
        module: "channels",
        memoSaved: false,
      };
    }
    case "navigator":
      return {
        specialist: "navigator",
        summary: `Navigator pulled plan context: ${excerptContext(input.context, /\b(plan|goal|handoff|week|month|ecs|\$bay|task)\b/i)}`,
        module: "plan",
        memoSaved: false,
      };
    case "sentinel":
      return {
        specialist: "sentinel",
        summary: `Sentinel on Pulse and commute: ${excerptContext(input.context, /\b(pulse|weather|commute|leave|quake|fire|air|alert|flight|iss|fitness|workout)\b/i)}`,
        module: "vitals",
        memoSaved: false,
      };
    case "wire":
      return {
        specialist: "wire",
        summary: `Wire on Woodhouse, Shopify, and connected apps: ${excerptContext(input.context, /\b(woodhouse|shopify|easy supply|commerce|store|order|fulfill|apps?|network|node|sync|connect|online|offline|family purpose)\b/i)}`,
        module: "apps",
        memoSaved: false,
      };
    case "quartermaster":
      return {
        specialist: "quartermaster",
        summary: `Quartermaster on meals and shopping: ${excerptContext(input.context, /\b(shop|meal|grocery|pantry|list)\b/i)}`,
        module: "meal",
        memoSaved: false,
      };
    case "curator":
      return {
        specialist: "curator",
        summary: `Curator on Hub: ${excerptContext(input.context, /\b(memo|hub|gym|watch|routine)\b/i)}. Offer to save a memo if E wants this conversation kept.`,
        module: "hub",
        memoSaved: false,
      };
    case "archivist":
      return {
        specialist: "archivist",
        summary: `Archivist on ECS log and roadmap: ${excerptContext(input.context, /\b(roadmap|ecs|timeline|log|tortuga|north star|network ops)\b/i)}`,
        module: "ecs",
        memoSaved: false,
      };
    case "woodhouse": {
      const ops = teamEfficiencySummary(history, task);
      return {
        specialist: "woodhouse",
        summary: `Woodhouse (team ops): ${ops} ${task ? `Task checked: ${task.slice(0, 120)}.` : ""} Iris should avoid duplicate consults when Heads-up or Duplicate risk is present.`,
        module: "team",
        memoSaved: false,
      };
    }
    default:
      return {
        specialist: input.specialist,
        summary: "Specialist unavailable.",
        module: def.module,
        memoSaved: false,
      };
  }
}

export function specialistEnumForTool(): string[] {
  return IRIS_TEAM.map((s) => s.id);
}
