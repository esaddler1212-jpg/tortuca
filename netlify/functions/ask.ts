import Anthropic from "@anthropic-ai/sdk";
import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { dayKey } from "../../shared/timezone";

/**
 * POST /api/ask: Iris's conversation brain (Claude). Signed-in only, capped
 * per day, short spoken-style replies. The one tool, add_todo, is run by the
 * app (it adds to Do today), so this returns the reply text plus any to-dos.
 */

const MODEL = "claude-opus-5-5";
const DAILY_LIMIT = 150; // turns per account per day: a guard against runaway cost
const MAX_TURNS = 12;
const MAX_CHARS = 2000;

// Stable persona: kept byte-identical so it can be served from the prompt cache.
const PERSONA = `You are Iris, E's personal chief of staff and the voice of IRIS, his command center. E is Eric Saddler II in Vallejo, CA. E runs ECS Network: Tortuga (film, the $BAY series), North Star (a youth program for middle schoolers), Easy Supply (merch) and 2EASY (music). By day he works with middle schoolers at Family Purpose.

You are speaking out loud through a phone or computer speaker, in a back-and-forth voice conversation.
- Answer in one to three short sentences unless E asks for more. Plain spoken English: no lists, markdown, emoji or URLs.
- Warm, sharp and direct, with a little wit, like a trusted chief of staff who knows the business inside out. Call him E sometimes, not every time.
- Use the "Right now" notes for anything about his day, schedule, weather, plans or goals. If something isn't in the notes, say you don't have it rather than guessing.
- When E asks you to remember, add or remind him of something to do, call add_todo (one call per item) and confirm it briefly.
- Never ask for or repeat students' names or personal details from Family Purpose; refer to "a student".
- You can't send email, change the calendar or spend money; say so and offer to add it as a to-do instead.
Latency-sensitive; begin your visible answer immediately.`;

const ADD_TODO = {
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

type Turn = { role: "user" | "assistant"; content: string };

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export const handler: Handler = async (event) => {
  initBlobs(event);
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });
  if (!process.env.ANTHROPIC_API_KEY) {
    return json(503, { error: "Iris's brain isn't set up yet: add ANTHROPIC_API_KEY in Netlify and redeploy." });
  }
  const sessionId = sessionHeader(event);
  const session = sessionId ? await getValidSession(sessionId) : null;
  if (!sessionId || !session) return json(401, { error: "Connect Google first so only you can talk to Iris." });

  let body: { messages?: Turn[]; context?: string; timeZone?: string };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Bad request" });
  }
  const turns = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") return json(400, { error: "Say something first." });

  // Daily cap per account.
  const usage = getStore({ name: "alfred-ask-usage" });
  const who = (session.email ?? sessionId).toLowerCase();
  const usageKey = `${who}:${dayKey(body.timeZone || "America/Los_Angeles")}`;
  const used = Number((await usage.get(usageKey)) ?? 0);
  if (used >= DAILY_LIMIT) return json(429, { error: "That's my limit for today. Let's pick it up tomorrow." });
  await usage.set(usageKey, String(used + 1));

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [
        { type: "text", text: PERSONA, cache_control: { type: "ephemeral" } },
        { type: "text", text: `Right now:\n${(body.context ?? "").slice(0, 8000)}` },
      ],
      tools: [ADD_TODO],
      messages: turns,
    });

    if (response.stop_reason === "refusal") {
      return json(200, { reply: "I can't help with that one, E. Ask me something else?", todos: [] });
    }

    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();
    const todos = response.content
      .filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === "add_todo")
      .map((b) => b.input as { title?: unknown; due?: unknown })
      .filter((i) => typeof i.title === "string" && i.title.trim())
      .map((i) => ({ title: String(i.title).trim().slice(0, 140), due: i.due === "today" || i.due === "tomorrow" ? i.due : "none" }));

    const reply =
      text ||
      (todos.length ? `Done. I added ${todos.map((t) => t.title).join(" and ")} to your list.` : "Sorry, I lost my train of thought. Say that again?");
    return json(200, { reply, todos });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json(429, { error: "I'm being rate-limited. Give me a minute." });
    if (error instanceof Anthropic.AuthenticationError) return json(503, { error: "Iris's API key was rejected. Check ANTHROPIC_API_KEY in Netlify." });
    if (error instanceof Anthropic.APIError) return json(502, { error: `Claude error (${error.status ?? "?"}). Try again.` });
    return json(502, { error: "Couldn't reach Claude. Try again." });
  }
};
