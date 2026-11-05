import Anthropic from "@anthropic-ai/sdk";
import { HUD_MODULE_IDS, moduleContextForIris } from "../../shared/hudModules";

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
- When E asks to open, show, pull up, or go to part of IRIS (today's list, plan, inbox, drafts, research, hub, meals, apps, vitals, ECS log), call open_module with the best-matching module id and say briefly that you're bringing it up.
- Never ask for or repeat students' names or personal details from Family Purpose; refer to "a student".
- For news, scores, prices, store hours, events, people, or anything current you don't already know, use web_search; use web_fetch to read a specific page E names. Then answer in a sentence or two, naming the source out loud ("per KQED"), never reading URLs. Don't search for things in the "Right now" notes.
- When E tells you something lasting about himself, his work or his preferences (routines, people by role, how he likes things), or says "remember", call remember with one short fact in third person ("E meets the $BAY sponsor every other Thursday"). When he says to forget something, call forget. Use what you remember naturally; don't recite the list. Never remember students' names or details, passwords, or account or card numbers.
- The notes also show E's inbox (senders and subjects only, not the email text), recent memos, money this month, gym week and shopping list. Answer from them ("anything from Jordan?", "what's on my list?", "how much did I spend on food?"). School and family emails and memos are withheld on purpose: if asked, say there are some and E can check them in the Inbox or the Family Purpose app. You can't read or send email.
- When E asks where a flight is, when it lands, or how high it is ("where's UA 123?"), call track_flight with the flight number and answer from its result in a sentence or two. For ISS or satellite sightings, use the "Right now" notes.
- You can't send email, change the calendar or spend money; say so and offer to add it as a to-do instead.
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

/** Things Iris must never store, whatever the model decides. */
const NEVER_STORE = /\b(password|passcode|pin\b|ssn|social security|account number|routing|card number|cvv)\b|\d[\d\s-]{7,}\d/i;
export function safeFact(fact: string): string | null {
  const f = fact.trim().replace(/\s+/g, " ").slice(0, 200);
  return f.length >= 4 && !NEVER_STORE.test(f) ? f : null;
}

/** Facts matching a "forget …" request (shared words, ignoring filler). */
export function matchesForget(fact: string, about: string): boolean {
  const words = about.toLowerCase().split(/[^a-z0-9$]+/).filter((w) => w.length > 2 && !/^(the|that|this|about|thing|stuff|with|and|for)$/.test(w));
  if (!words.length) return false;
  const f = fact.toLowerCase();
  return words.filter((w) => f.includes(w)).length >= Math.ceil(words.length / 2);
}

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
  tools: { trackFlight?: (flight: string) => Promise<string> } = {},
): Promise<{
  reply: string;
  todos: IrisTodo[];
  remember: string[];
  forget: string[];
  searched: boolean;
  refused: boolean;
  module: string | null;
  usage: IrisTurnUsage;
}> {
  const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((t) => ({ role: t.role, content: t.content }));
  const texts: string[] = [];
  const todos: IrisTodo[] = [];
  const remember: string[] = [];
  const forget: string[] = [];
  let searched = false;
  let module: string | null = null;
  const usage: IrisTurnUsage = { model: MODEL, inTok: 0, outTok: 0, cacheRead: 0, cacheWrite: 0, searches: 0, fetches: 0, tools: [], hops: 0 };
  for (let hop = 0; hop < 4; hop++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [
        { type: "text", text: PERSONA, cache_control: { type: "ephemeral" } },
        { type: "text", text: `Right now:\n${context.slice(0, 8000)}` },
        ...(memory.length ? [{ type: "text" as const, text: `What you remember about E:\n${memory.map((m) => `- ${m}`).join("\n")}` }] : []),
      ],
      tools: [ADD_TODO, OPEN_MODULE, ...(tools.trackFlight ? [TRACK_FLIGHT] : []), ...MEMORY_TOOLS, ...WEB_TOOLS],
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
    if (response.stop_reason === "refusal") return { reply: "", todos: [], remember: [], forget: [], searched, refused: true, module: null, usage };
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
          todos.push({ title: i.title.trim().slice(0, 140), due: i.due === "today" || i.due === "tomorrow" ? i.due : "none" });
        }
      } else if (b.type === "tool_use" && b.name === "open_module") {
        const id = String((b.input as { module?: unknown }).module ?? "").trim();
        if (HUD_MODULE_IDS.includes(id as (typeof HUD_MODULE_IDS)[number])) module = id;
      }
    }
    const lookups = response.content.filter((b) => b.type === "tool_use" && b.name === "track_flight");
    if (response.stop_reason === "tool_use" && lookups.length && tools.trackFlight) {
      // Iris needs the flight data to answer: run it and hand the results back.
      // Every tool call in the turn gets a result (the app runs the others).
      messages.push({ role: "assistant", content: response.content as Anthropic.Beta.BetaContentBlockParam[] });
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const b of response.content) {
        if (b.type !== "tool_use") continue;
        let content = "Done.";
        if (b.name === "track_flight") {
          try {
            content = await tools.trackFlight(String((b.input as { flight?: unknown }).flight ?? ""));
          } catch {
            content = "The flight tracker isn't answering right now.";
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
  return { reply: forVoice(texts.join(" ")), todos, remember, forget, searched, refused: false, module, usage };
}
