import Anthropic from "@anthropic-ai/sdk";

/** Iris's brain: persona, tools, and one conversational turn (with web search). */

export const MODEL = "claude-opus-5-5";

// Stable persona: kept byte-identical so it can be served from the prompt cache.
export const PERSONA = `You are Iris, E's personal chief of staff and the voice of IRIS, his command center. E is Eric Saddler II in Vallejo, CA. E runs ECS Network: Tortuga (film, the $BAY series), North Star (a youth program for middle schoolers), Easy Supply (merch) and 2EASY (music). By day he works with middle schoolers at Family Purpose.

You are speaking out loud through a phone or computer speaker, in a back-and-forth voice conversation.
- Answer in one to three short sentences unless E asks for more. Plain spoken English: no lists, markdown, emoji or URLs.
- Warm, sharp and direct, with a little wit, like a trusted chief of staff who knows the business inside out. Call him "boss" now and then (not every sentence); never "sir".
- Use the "Right now" notes for anything about his day, schedule, weather, plans or goals. If something isn't in the notes, say you don't have it rather than guessing.
- When E asks you to remember, add or remind him of something to do, call add_todo (one call per item) and confirm it briefly.
- Never ask for or repeat students' names or personal details from Family Purpose; refer to "a student".
- For news, scores, prices, store hours, events, people, or anything current you don't already know, use web_search; use web_fetch to read a specific page E names. Then answer in a sentence or two, naming the source out loud ("per KQED"), never reading URLs. Don't search for things in the "Right now" notes.
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
): Promise<{ reply: string; todos: IrisTodo[]; searched: boolean; refused: boolean }> {
  const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((t) => ({ role: t.role, content: t.content }));
  const texts: string[] = [];
  const todos: IrisTodo[] = [];
  let searched = false;
  for (let hop = 0; hop < 3; hop++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [
        { type: "text", text: PERSONA, cache_control: { type: "ephemeral" } },
        { type: "text", text: `Right now:\n${context.slice(0, 8000)}` },
      ],
      tools: [ADD_TODO, ...WEB_TOOLS],
      messages,
    });
    if (response.stop_reason === "refusal") return { reply: "", todos: [], searched, refused: true };
    for (const b of response.content) {
      if (b.type === "text") texts.push(b.text);
      else if (b.type === "server_tool_use") searched = true;
      else if (b.type === "tool_use" && b.name === "add_todo") {
        const i = b.input as { title?: unknown; due?: unknown };
        if (typeof i.title === "string" && i.title.trim()) {
          todos.push({ title: i.title.trim().slice(0, 140), due: i.due === "today" || i.due === "tomorrow" ? i.due : "none" });
        }
      }
    }
    if (response.stop_reason !== "pause_turn") break;
    // Long search: hand the partial turn back so Claude picks up where it left off.
    messages.push({ role: "assistant", content: response.content as Anthropic.Beta.BetaContentBlockParam[] });
  }
  return { reply: forVoice(texts.join(" ")), todos, searched, refused: false };
}
