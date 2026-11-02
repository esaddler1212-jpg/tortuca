import Anthropic from "@anthropic-ai/sdk";
import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { dayKey } from "../../shared/timezone";
import { matchesForget, runIris } from "./_iris";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";

/**
 * POST /api/ask: Iris's conversation brain (Claude). Signed-in only, capped
 * per day, short spoken-style replies. The one tool, add_todo, is run by the
 * app (it adds to Do today), so this returns the reply text plus any to-dos.
 */

const DAILY_LIMIT = 150; // turns per account per day: a guard against runaway cost
const MAX_TURNS = 12;
const MAX_CHARS = 2000;

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

  // Fail fast (Netlify functions have a time limit); no automatic retries.
  const client = new Anthropic({ timeout: 24_000, maxRetries: 0 });
  try {
    // Iris's memory lives with the account's data (shared by phone and computer).
    const key = await resolveDataKey(sessionId);
    const memory = ((await loadUserData(key))?.irisMemory ?? []).map((m) => m.fact);
    const { reply: text, todos, remember, forget, refused, planet } = await runIris(client, turns, body.context ?? "", memory);
    if (refused) return json(200, { reply: "I can't help with that one, boss. Ask me something else?", todos: [] });
    if (remember.length || forget.length) {
      const latest = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
      let facts = (latest.irisMemory ?? []).filter((m) => !forget.some((f) => matchesForget(m.fact, f)));
      for (const fact of remember) {
        if (!facts.some((m) => m.fact.toLowerCase() === fact.toLowerCase())) {
          facts.push({ id: `mem-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, fact, at: new Date().toISOString() });
        }
      }
      facts = facts.slice(-60);
      await saveUserData(key, { ...latest, irisMemory: facts });
    }
    const reply =
      text ||
      (todos.length
        ? `Done. I added ${todos.map((t) => t.title).join(" and ")} to your list.`
        : remember.length
          ? "Got it. I'll remember that."
          : forget.length
            ? "Done. I've forgotten it."
            : "Sorry, I lost my train of thought. Say that again?");
    return json(200, { reply, todos, planet: planet && typeof planet === "string" ? planet : undefined });
  } catch (error) {
    if (error instanceof Anthropic.APIConnectionTimeoutError) return json(504, { error: "That one took too long, boss. Try asking a simpler way." });
    if (error instanceof Anthropic.RateLimitError) return json(429, { error: "I'm being rate-limited. Give me a minute." });
    if (error instanceof Anthropic.AuthenticationError) return json(503, { error: "Iris's API key was rejected. Check ANTHROPIC_API_KEY in Netlify." });
    if (error instanceof Anthropic.APIError) return json(502, { error: `Claude error (${error.status ?? "?"}). Try again.` });
    return json(502, { error: "Couldn't reach Claude. Try again." });
  }
};
