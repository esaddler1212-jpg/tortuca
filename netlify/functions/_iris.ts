import Anthropic from "@anthropic-ai/sdk";
import { HUD_MODULE_IDS, moduleContextForIris } from "../../shared/hudModules";
import { teamContextForIris, type IrisSpecialistId, isIrisSpecialistId } from "../../shared/irisTeam";
import { specialistEnumForTool } from "./_irisSpecialists";
import {
  DELEGATE_MAX_REPORT_CHARS,
  IRIS_MAX_CONTEXT_CHARS,
  IRIS_MAX_HOPS,
  IRIS_MAX_TODO_TITLE_CHARS,
  safeFact,
} from "../../shared/agentGuardrails";
import type { TierAToolBatch } from "./_tierAApply";
import { emptyTierABatch } from "./_tierAApply";
import type { CalendarProposalKind } from "../../shared/tierAOps";

/** Iris's brain: persona, tools, and one conversational turn (with web search). */

export const MODEL = "claude-opus-5-5";

// Stable persona: kept byte-identical so it can be served from the prompt cache.
export const PERSONA = `You are Iris, E's personal chief of staff and the voice of IRIS, his command center. E is Eric Saddler II in Vallejo, CA. E runs ECS Network: Tortuga (film, the $BAY series), North Star (a youth program for middle schoolers), Easy Supply (merch) and 2EASY (music). By day he works with middle schoolers at Family Purpose.

You are speaking out loud through a phone or computer speaker, in a back-and-forth voice conversation.
- Answer in one to three short sentences unless E asks for more. Plain spoken English: no lists, markdown, emoji or URLs.
- Lead with the answer. Don't end every reply with a question or an offer; when you've answered, stop. Ask back only when it genuinely moves things forward.
- E's words come through speech-to-text, which mishears names, numbers and short words. Go with the most likely meaning; ask a quick clarifying question only if you truly can't tell.
- Make numbers easy to hear: round when exact doesn't matter ("about 20 minutes", "around 36 thousand feet"), say times like a person ("6:40 tonight").
- Warm, sharp and direct, with a little wit, like a trusted chief of staff who knows the business inside out. Call him "boss" now and then (not every sentence); never "sir".
- Use the "Right now" notes for anything about his day, schedule, weather, plans or goals. If something isn't in the notes, say you don't have it rather than guessing.
- When E asks you to remember, add or remind him of something to do, call add_todo (one call per item) and confirm it briefly.
- When E asks to open, show, pull up, or go to part of IRIS (today's list, plan, inbox, drafts, research, team roster, hub, meals, apps, vitals, ECS log), call open_module with the best-matching module id and say briefly that you're bringing it up.
- Never ask for or repeat students' names or personal details from Family Purpose; refer to "a student".
- For news, scores, prices, store hours, events, people, or anything current you don't already know, use web_search; use web_fetch to read a specific page E names. Then answer in a sentence or two, naming the source out loud ("per KQED"), never reading URLs. Don't search for things in the "Right now" notes.
- When E tells you something lasting about himself, his work or his preferences (routines, people by role, how he likes things), or says "remember", call remember with one short fact in third person ("E meets the $BAY sponsor every other Thursday"). When he says to forget something, call forget. Use what you remember naturally; don't recite the list. Never remember students' names or details, passwords, or account or card numbers.
- The notes also show E's inbox (senders and subjects only, not the email text), recent memos, money this month, gym week and shopping list. Answer from them ("anything from Jordan?", "what's on my list?", "how much did I spend on food?"). School and family emails and memos are withheld on purpose: if asked, say there are some and E can check them in the Inbox or the Family Purpose app. You can't read or send email.
- Answer module domains (today, inbox, vitals, plan, apps, hub, meals, team roster, ECS) directly from Right now — do not call consult_specialist for those. consult_specialist is only for Scout (sourced business research) or Scribe (draft an email in Drafts).
- When E asks where a flight is, when it lands, or how high it is ("where's UA 123?"), call track_flight with the flight number and answer from its result in a sentence or two. For ISS or satellite sightings, use the "Right now" notes.
- You can't send email or spend money. For calendar creates, moves, or declines, call propose_calendar_change — E confirms in Today before anything hits Google Calendar. For promises to people, call add_commitment. Before important meetings, call prepare_meeting with a short objective and talking points. For an approved phone script, call propose_voice_call — E confirms before dialing.
Latency-sensitive; begin your visible answer immediately.`;

export const ADD_TODO = {
  name: "add_todo",
  description:
    "Add an item to E's to-do list in IRIS (shows on Do today). Use when E asks to remember, add, or be reminded of something to do.",
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Short, action-first to-do, e.g. 'Call Mike about the shoot'." },
      due: { type: "string", enum: ["today", "tomorrow", "none"], description: "When it's due." },
    },
    required: ["title", "due"],
    additionalProperties: false,
  },
};

export const TRACK_FLIGHT = {
  name: "track_flight",
  description:
    "Live position of a flight from public ADS-B data: altitude, speed, distance from E, route and estimated landing time. Use when E asks where a flight is or when it lands.",
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: {
      flight: { type: "string", description: "Flight number as E said it, e.g. 'UA 123', 'Southwest 2201', or a tail number like 'N123AB'." },
    },
    required: ["flight"],
    additionalProperties: false,
  },
};

export const CONSULT_SPECIALIST = {
  name: "consult_specialist",
  description:
    "Rare delegation only. Scout: live web business research (saves Hub memo). Scribe: create a pending email draft in Drafts. Do not use for inbox, today, vitals, plan, hub, meals, apps, or team — answer those from Right now yourself.",
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: {
      specialist: {
        type: "string",
        enum: specialistEnumForTool(),
        description: "scout or scribe only.",
      },
      task: { type: "string", description: "What you need them to do." },
      query: { type: "string", description: "Scout only: research question (defaults to task)." },
      area: {
        type: "string",
        description: "Scout only: ECS area (General, ECS, Tortuga, North Star, Easy Supply, 2EASY, Personal).",
      },
    },
    required: ["specialist", "task"],
    additionalProperties: false,
  },
};

export const ADD_COMMITMENT = {
  name: "add_commitment",
  description: "Record a promise E made to someone (commitment ledger on Today). Use when E says he told someone he'd do something by a date.",
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: {
      promise: { type: "string", description: "What E promised to do." },
      owed_to: { type: "string", description: "Person or org E owes it to." },
      due: { type: "string", description: "Optional due date YYYY-MM-DD." },
    },
    required: ["promise", "owed_to"],
    additionalProperties: false,
  },
};

export const PREPARE_MEETING = {
  name: "prepare_meeting",
  description: "Save a meeting prep pack (objective, talking points, risks) for an upcoming event E names.",
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Meeting title." },
      objective: { type: "string", description: "One sentence goal for the meeting." },
      talking_points: { type: "array", items: { type: "string" }, description: "Up to 5 bullets." },
      risks: { type: "array", items: { type: "string" }, description: "Optional risks or open loops." },
      event_id: { type: "string", description: "Google calendar event id if known." },
      starts_at: { type: "string", description: "ISO start time if known." },
    },
    required: ["title", "objective", "talking_points"],
    additionalProperties: false,
  },
};

export const PROPOSE_CALENDAR_CHANGE = {
  name: "propose_calendar_change",
  description:
    "Propose a calendar create, move, or decline for E to confirm in Today (never applies immediately). Use create for new events; move when rescheduling; decline to cancel.",
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: {
      kind: { type: "string", enum: ["create", "move", "decline"], description: "Type of change." },
      title: { type: "string", description: "Event title." },
      event_id: { type: "string", description: "Existing event id for move/decline." },
      start: { type: "string", description: "For create: start ISO datetime." },
      end: { type: "string", description: "For create: end ISO datetime." },
      new_start: { type: "string", description: "For move: new start ISO." },
      new_end: { type: "string", description: "For move: new end ISO." },
      location: { type: "string", description: "Optional location." },
      description: { type: "string", description: "Optional description." },
    },
    required: ["kind", "title"],
    additionalProperties: false,
  },
};

export const PROPOSE_VOICE_CALL = {
  name: "propose_voice_call",
  description: "Queue an outbound phone call script for E to approve before Twilio dials.",
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: {
      to_number: { type: "string", description: "E.164 or US number to call." },
      label: { type: "string", description: "Short label, e.g. school office." },
      script: { type: "string", description: "What Iris should say when they answer (short)." },
    },
    required: ["to_number", "label", "script"],
    additionalProperties: false,
  },
};

export const OPEN_MODULE = {
  name: "open_module",
  description:
    "Bring an IRIS HUD module to the front (tab bar or More sheet). Use when E asks to open, show, or go to part of the app.",
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: {
      module: {
        type: "string",
        enum: HUD_MODULE_IDS,
        description: `Module id. Hints: ${moduleContextForIris()}`,
      },
    },
    required: ["module"],
    additionalProperties: false,
  },
};

const FACT_TOOL = (name: "remember" | "forget", description: string, field: "fact" | "about") => ({
  name,
  description,
  strict: true,
  input_schema: {
    type: "object" as const,
    properties: { [field]: { type: "string", description: field === "fact" ? "One short, lasting fact in third person." : "What to forget, in a few words." } },
    required: [field],
    additionalProperties: false,
  },
});
export const MEMORY_TOOLS = [
  FACT_TOOL("remember", "Save one lasting fact or preference about E for future conversations.", "fact"),
  FACT_TOOL("forget", "Forget remembered facts about something E asks you to forget.", "about"),
];

export { matchesForget, safeFact } from "../../shared/agentGuardrails";

/** Claude-hosted web tools: search the web and read pages (no server of ours needed). */
export const WEB_TOOLS = [
  {
    type: "web_search_20260209" as const,
    name: "web_search" as const,
    max_uses: 3,
    user_location: { type: "approximate" as const, city: "Vallejo", region: "California", country: "US", timezone: "America/Los_Angeles" },
  },
  { type: "web_fetch_20260209" as const, name: "web_fetch" as const, max_uses: 2 },
];

/** What one turn used (tokens, tools, which model served). */
export type IrisTurnUsage = {
  model: string;
  inTok: number;
  outTok: number;
  cacheRead: number;
  cacheWrite: number;
  searches: number;
  fetches: number;
  tools: string[];
  hops: number;
};

export type IrisTurn = { role: "user" | "assistant"; content: string };
export type IrisTodo = { title: string; due: "today" | "tomorrow" | "none" };

/** Spoken text: drop markdown links/URLs and citation clutter. */
export function forVoice(text: string): string {
  return text
    .replace(/\s*\(\s*\[[^\]]+\]\(https?:[^)]+\)\s*\)/g, "") // "([recap](url))": drop it
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1")
    .replace(/\(?https?:\/\/\S+\)?/g, "")
    .replace(/[*_#`]/g, "")
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * One turn with Iris. Server tools (web search/fetch) can pause a long turn
 * ("pause_turn"); we send the partial answer back so Claude continues.
 */
export async function runIris(
  client: Anthropic,
  turns: IrisTurn[],
  context: string,
  memory: string[] = [],
  tools: {
    trackFlight?: (flight: string) => Promise<string>;
    consultSpecialist?: (input: {
      specialist: IrisSpecialistId;
      task: string;
      query?: string;
      area?: string;
    }) => Promise<{ summary: string; module: string | null; specialist: IrisSpecialistId; deduped?: boolean }>;
  } = {},
): Promise<{
  reply: string;
  todos: IrisTodo[];
  remember: string[];
  forget: string[];
  searched: boolean;
  refused: boolean;
  module: string | null;
  specialist: IrisSpecialistId | null;
  delegateReport: string | null;
  delegateDeduped: boolean;
  usage: IrisTurnUsage;
  tierA: TierAToolBatch;
}> {
  const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((t) => ({ role: t.role, content: t.content }));
  const texts: string[] = [];
  const todos: IrisTodo[] = [];
  const tierA = emptyTierABatch();
  const remember: string[] = [];
  const forget: string[] = [];
  let searched = false;
  let module: string | null = null;
  let specialist: IrisSpecialistId | null = null;
  let delegateReport: string | null = null;
  let delegateDeduped = false;
  const usage: IrisTurnUsage = { model: MODEL, inTok: 0, outTok: 0, cacheRead: 0, cacheWrite: 0, searches: 0, fetches: 0, tools: [], hops: 0 };
  for (let hop = 0; hop < IRIS_MAX_HOPS; hop++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [
        { type: "text", text: PERSONA, cache_control: { type: "ephemeral" } },
        { type: "text", text: teamContextForIris(), cache_control: { type: "ephemeral" } },
        { type: "text", text: `Right now:\n${context.slice(0, IRIS_MAX_CONTEXT_CHARS)}` },
        ...(memory.length ? [{ type: "text" as const, text: `What you remember about E:\n${memory.map((m) => `- ${m}`).join("\n")}` }] : []),
      ],
      tools: [
        ADD_TODO,
        ADD_COMMITMENT,
        PREPARE_MEETING,
        PROPOSE_CALENDAR_CHANGE,
        PROPOSE_VOICE_CALL,
        OPEN_MODULE,
        ...(tools.trackFlight ? [TRACK_FLIGHT] : []),
        ...(tools.consultSpecialist ? [CONSULT_SPECIALIST] : []),
        ...MEMORY_TOOLS,
        ...WEB_TOOLS,
      ],
      messages,
    });
    // Numbers only, for the usage log (never the words).
    const u = response.usage;
    usage.hops++;
    usage.model = response.model || usage.model;
    usage.inTok += u?.input_tokens ?? 0;
    usage.outTok += u?.output_tokens ?? 0;
    usage.cacheRead += u?.cache_read_input_tokens ?? 0;
    usage.cacheWrite += u?.cache_creation_input_tokens ?? 0;
    usage.searches += u?.server_tool_use?.web_search_requests ?? 0;
    usage.fetches += u?.server_tool_use?.web_fetch_requests ?? 0;
    for (const b of response.content) if (b.type === "tool_use") usage.tools.push(b.name);
    if (response.stop_reason === "refusal") {
      return { reply: "", todos: [], remember: [], forget: [], searched, refused: true, module: null, specialist: null, delegateReport: null, delegateDeduped: false, usage, tierA: emptyTierABatch() };
    }
    for (const b of response.content) {
      if (b.type === "text") texts.push(b.text);
      else if (b.type === "server_tool_use") searched = true;
      else if (b.type === "tool_use" && b.name === "remember") {
        const fact = safeFact(String((b.input as { fact?: unknown }).fact ?? ""));
        if (fact) remember.push(fact);
      } else if (b.type === "tool_use" && b.name === "forget") {
        const about = String((b.input as { about?: unknown }).about ?? "").trim();
        if (about) forget.push(about);
      } else if (b.type === "tool_use" && b.name === "add_todo") {
        const i = b.input as { title?: unknown; due?: unknown };
        if (typeof i.title === "string" && i.title.trim()) {
          todos.push({ title: i.title.trim().slice(0, IRIS_MAX_TODO_TITLE_CHARS), due: i.due === "today" || i.due === "tomorrow" ? i.due : "none" });
        }
      } else if (b.type === "tool_use" && b.name === "open_module") {
        const id = String((b.input as { module?: unknown }).module ?? "").trim();
        if (HUD_MODULE_IDS.includes(id as (typeof HUD_MODULE_IDS)[number])) module = id;
      } else if (b.type === "tool_use" && b.name === "add_commitment") {
        const i = b.input as { promise?: unknown; owed_to?: unknown; due?: unknown };
        tierA.commitments.push({
          promise: String(i.promise ?? ""),
          owed_to: String(i.owed_to ?? ""),
          due: typeof i.due === "string" ? i.due : undefined,
        });
      } else if (b.type === "tool_use" && b.name === "prepare_meeting") {
        const i = b.input as {
          title?: unknown;
          objective?: unknown;
          talking_points?: unknown;
          risks?: unknown;
          event_id?: unknown;
          starts_at?: unknown;
        };
        tierA.meetingPreps.push({
          title: String(i.title ?? ""),
          objective: String(i.objective ?? ""),
          talking_points: Array.isArray(i.talking_points) ? i.talking_points.map(String) : [],
          risks: Array.isArray(i.risks) ? i.risks.map(String) : [],
          event_id: typeof i.event_id === "string" ? i.event_id : undefined,
          starts_at: typeof i.starts_at === "string" ? i.starts_at : undefined,
        });
      } else if (b.type === "tool_use" && b.name === "propose_calendar_change") {
        const i = b.input as {
          kind?: unknown;
          title?: unknown;
          event_id?: unknown;
          start?: unknown;
          end?: unknown;
          new_start?: unknown;
          new_end?: unknown;
          location?: unknown;
          description?: unknown;
        };
        const kind = i.kind === "create" || i.kind === "move" || i.kind === "decline" ? (i.kind as CalendarProposalKind) : "create";
        tierA.calendarProposals.push({
          kind,
          title: String(i.title ?? ""),
          event_id: typeof i.event_id === "string" ? i.event_id : undefined,
          start: typeof i.start === "string" ? i.start : undefined,
          end: typeof i.end === "string" ? i.end : undefined,
          new_start: typeof i.new_start === "string" ? i.new_start : undefined,
          new_end: typeof i.new_end === "string" ? i.new_end : undefined,
          location: typeof i.location === "string" ? i.location : undefined,
          description: typeof i.description === "string" ? i.description : undefined,
        });
      } else if (b.type === "tool_use" && b.name === "propose_voice_call") {
        const i = b.input as { to_number?: unknown; label?: unknown; script?: unknown };
        tierA.voiceCalls.push({
          to_number: String(i.to_number ?? ""),
          label: String(i.label ?? ""),
          script: String(i.script ?? ""),
        });
      }
    }
    const toolUses = response.content.filter((b) => b.type === "tool_use");
    const needsClientRun = toolUses.some(
      (b) =>
        (b.name === "track_flight" && tools.trackFlight) ||
        (b.name === "consult_specialist" && tools.consultSpecialist),
    );
    if (response.stop_reason === "tool_use" && needsClientRun) {
      messages.push({ role: "assistant", content: response.content as Anthropic.Beta.BetaContentBlockParam[] });
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const b of toolUses) {
        let content = "Done.";
        if (b.name === "track_flight" && tools.trackFlight) {
          try {
            content = await tools.trackFlight(String((b.input as { flight?: unknown }).flight ?? ""));
          } catch {
            content = "The flight tracker isn't answering right now.";
          }
        } else if (b.name === "consult_specialist" && tools.consultSpecialist) {
          const i = b.input as { specialist?: unknown; task?: unknown; query?: unknown; area?: unknown };
          const id = String(i.specialist ?? "").trim();
          const task = String(i.task ?? "").trim();
          if (!isIrisSpecialistId(id) || !task) {
            content = "Need a valid specialist and task.";
          } else {
            try {
              const r = await tools.consultSpecialist({
                specialist: id,
                task,
                query: typeof i.query === "string" ? i.query : undefined,
                area: typeof i.area === "string" ? i.area : undefined,
              });
              content = r.summary;
              if (r.module && HUD_MODULE_IDS.includes(r.module as (typeof HUD_MODULE_IDS)[number])) module = r.module;
              if (r.deduped) {
                delegateDeduped = true;
              } else {
                specialist = r.specialist;
                delegateReport = r.summary.slice(0, DELEGATE_MAX_REPORT_CHARS);
              }
            } catch {
              content = "That specialist couldn't finish right now.";
            }
          }
        }
        results.push({ type: "tool_result", tool_use_id: b.id, content });
      }
      messages.push({ role: "user", content: results });
      continue;
    }
    if (response.stop_reason !== "pause_turn") break;
    // Long search: hand the partial turn back so Claude picks up where it left off.
    messages.push({ role: "assistant", content: response.content as Anthropic.Beta.BetaContentBlockParam[] });
  }
  return { reply: forVoice(texts.join(" ")), todos, remember, forget, searched, refused: false, module, specialist, delegateReport, delegateDeduped, usage, tierA };
}
