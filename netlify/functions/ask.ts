import Anthropic from "@anthropic-ai/sdk";
import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { dayKey } from "../../shared/timezone";
import {
  ASK_DAILY_TURN_LIMIT,
  clampIrisContext,
  DELEGATE_MAX_REPORT_CHARS,
  DELEGATE_MAX_TASK_CHARS,
  IRIS_MAX_MEMORY_FACTS,
  matchesForget,
  normalizeAskTurns,
} from "../../shared/agentGuardrails";
import { runIris } from "./_iris";
import { consultSpecialist } from "./_irisSpecialists";
import { lookupFlight } from "./_flight";
import { recordUsage } from "./_irisUsage";
import type { IrisTrace } from "../../shared/irisUsage";
import type { IrisSpecialistId } from "../../shared/irisTeam";
import { isIrisSpecialistId } from "../../shared/irisTeam";
import { parseDelegateHistory, mergeDelegateHistories, toSyncedDelegateLog } from "../../shared/irisTeamActivity";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";

/**
 * POST /api/ask: Iris's conversation brain (Claude). Signed-in only, capped
 * per day, short spoken-style replies. The one tool, add_todo, is run by the
 * app (it adds to Do today), so this returns the reply text plus any to-dos.
 */

const DAILY_LIMIT = ASK_DAILY_TURN_LIMIT;

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

  let body: { messages?: Turn[]; context?: string; timeZone?: string; lat?: number; lon?: number; delegateHistory?: unknown };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Bad request" });
  }
  const turns = normalizeAskTurns(body.messages ?? []);
  if (!turns.length || turns[turns.length - 1].role !== "user") return json(400, { error: "Say something first." });

  // Daily cap per account.
  const usage = getStore({ name: "alfred-ask-usage" });
  const who = (session.email ?? sessionId).toLowerCase();
  const usageKey = `${who}:${dayKey(body.timeZone || "America/Los_Angeles")}`;
  const used = Number((await usage.get(usageKey)) ?? 0);
  if (used >= DAILY_LIMIT) return json(429, { error: "That's my limit for today. Let's pick it up tomorrow." });
  await usage.set(usageKey, String(used + 1));

  // Fail fast (Netlify functions have a time limit); no automatic retries.
  const client = new Anthropic({ timeout: 52_000, maxRetries: 0 });
  const started = Date.now();
  const tz = body.timeZone || "America/Los_Angeles";
  const blank = { model: "claude-opus-5-5", inTok: 0, outTok: 0, cacheRead: 0, cacheWrite: 0, searches: 0, fetches: 0, tools: [] as string[], hops: 0 };
  const log = (usage: typeof blank, outcome: IrisTrace["outcome"]) =>
    recordUsage(who, { at: new Date().toISOString(), ms: Date.now() - started, ...usage, outcome }, tz);
  try {
    // Iris's memory lives with the account's data (shared by phone and computer).
    const key = await resolveDataKey(sessionId);
    const accountData = await loadUserData(key);
    const memory = (accountData?.irisMemory ?? []).map((m) => m.fact);
    const here = coords({ lat: String(body.lat ?? ""), lon: String(body.lon ?? "") });
    const delegateHistory = mergeDelegateHistories(accountData?.irisDelegateHistory, parseDelegateHistory(body.delegateHistory));
    const { reply: text, todos, remember, forget, refused, module, specialist, delegateReport, delegateDeduped, usage } = await runIris(
      client,
      turns,
      clampIrisContext(body.context ?? ""),
      memory,
      {
        trackFlight: async (flight) => (await lookupFlight(flight, tz, here.lat, here.lon)).spoken,
        consultSpecialist: async (input) => {
          const r = await consultSpecialist(client, {
            ...input,
            context: body.context ?? "",
            sessionId,
            who,
            timeZone: tz,
            delegateHistory,
            sessionEmail: session.email ?? undefined,
          });
          return { summary: r.summary, module: r.module, specialist: r.specialist, deduped: r.deduped };
        },
      },
    );
    await log(usage, refused ? "refused" : "ok");
    if (refused) return json(200, { reply: "I can't help with that one, boss. Ask me something else?", todos: [] });
    if (remember.length || forget.length) {
      const latest = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
      let facts = (latest.irisMemory ?? []).filter((m) => !forget.some((f) => matchesForget(m.fact, f)));
      for (const fact of remember) {
        if (!facts.some((m) => m.fact.toLowerCase() === fact.toLowerCase())) {
          facts.push({ id: `mem-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, fact, at: new Date().toISOString() });
        }
      }
      facts = facts.slice(-IRIS_MAX_MEMORY_FACTS);
      await saveUserData(key, { ...latest, irisMemory: facts });
    }
    if (specialist && !delegateDeduped && isIrisSpecialistId(specialist)) {
      const latest = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
      const lastUser = [...turns].reverse().find((t) => t.role === "user")?.content ?? "";
      const entry = toSyncedDelegateLog({
        specialist: specialist as IrisSpecialistId,
        at: new Date().toISOString(),
        task: lastUser.slice(0, DELEGATE_MAX_TASK_CHARS),
        report: delegateReport?.slice(0, DELEGATE_MAX_REPORT_CHARS),
      });
      const irisDelegateHistory = mergeDelegateHistories(latest.irisDelegateHistory, [entry]);
      await saveUserData(key, { ...latest, irisDelegateHistory });
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
    return json(200, {
      reply,
      todos,
      module: module && typeof module === "string" ? module : undefined,
      specialist: specialist && typeof specialist === "string" ? specialist : undefined,
      delegateReport: delegateReport && !delegateDeduped ? delegateReport : undefined,
      deduped: delegateDeduped || undefined,
    });
  } catch (error) {
    await log(
      blank,
      error instanceof Anthropic.APIConnectionTimeoutError ? "timeout" : error instanceof Anthropic.RateLimitError ? "rate_limited" : "error",
    );
    if (error instanceof Anthropic.APIConnectionTimeoutError) return json(504, { error: "That one took too long, boss. Try asking a simpler way." });
    if (error instanceof Anthropic.RateLimitError) return json(429, { error: "I'm being rate-limited. Give me a minute." });
    if (error instanceof Anthropic.AuthenticationError) return json(503, { error: "Iris's API key was rejected. Check ANTHROPIC_API_KEY in Netlify." });
    if (error instanceof Anthropic.APIError) return json(502, { error: `Claude error (${error.status ?? "?"}). Try again.` });
    return json(502, { error: "Couldn't reach Claude. Try again." });
  }
};
