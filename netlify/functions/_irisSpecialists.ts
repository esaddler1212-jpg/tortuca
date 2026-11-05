import type Anthropic from "@anthropic-ai/sdk";
import {
  type IrisSpecialistId,
  IRIS_TEAM,
  specialistById,
} from "../../shared/irisTeam";
import { runBusinessResearch } from "./_businessResearch";
import {
  appendHubMemo,
  incrementResearchUsage,
  researchUsageCount,
  RESEARCH_DAILY_LIMIT,
} from "./_researchMemo";

export interface SpecialistConsultResult {
  specialist: IrisSpecialistId;
  summary: string;
  module: string | null;
  memoSaved: boolean;
}

function excerptContext(context: string, keywords: RegExp, max = 1200): string {
  const lines = context.split("\n").filter((l) => keywords.test(l));
  const block = (lines.length ? lines : context.split("\n").slice(0, 12)).join("\n").trim();
  return block.slice(0, max) || "Nothing specific in the current notes for this.";
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

  const task = input.task.trim().slice(0, 500);
  if (!task) {
    return { specialist: input.specialist, summary: "Need a clear task for the team.", module: def.module, memoSaved: false };
  }

  switch (input.specialist) {
    case "scout": {
      const query = (input.query?.trim() || task).slice(0, 800);
      if (query.length < 8) {
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
    case "scribe":
      return {
        specialist: "scribe",
        summary: `Scribe says: open Drafts for this — ${task}. Pick the brand channel, edit the draft, then approve send. Iris can't send mail herself.`,
        module: "channels",
        memoSaved: false,
      };
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
        summary: `Wire on Woodhouse and connected apps: ${excerptContext(input.context, /\b(woodhouse|apps?|network|node|sync|connect|online|offline|family purpose)\b/i)}`,
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
