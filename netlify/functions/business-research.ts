import Anthropic from "@anthropic-ai/sdk";
import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { dayKey } from "../../shared/timezone";
import { researchMemoTitle, type BusinessResearchRequest, type ResearchTemplate } from "../../shared/businessResearch";
import {
  RESEARCH_DAILY_LIMIT,
  RESEARCH_MAX_CONTEXT_CHARS,
  RESEARCH_MIN_QUERY_CHARS,
  sanitizeResearchQuery,
} from "../../shared/agentGuardrails";
import { runBusinessResearch } from "./_businessResearch";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";
import { EMPTY_HUB, type HubState, type Memo } from "../../shared/hub";

/** POST /api/business-research — sourced business brief; saved to Hub memos. */

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export const handler: Handler = async (event) => {
  initBlobs(event);
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });
  if (!process.env.ANTHROPIC_API_KEY) {
    return json(503, { error: "Add ANTHROPIC_API_KEY in Netlify to run the Business Researcher." });
  }

  const sessionId = sessionHeader(event);
  const session = sessionId ? await getValidSession(sessionId) : null;
  if (!sessionId || !session) {
    return json(401, { error: "Connect Google first so research stays on your account." });
  }

  let body: BusinessResearchRequest & { timeZone?: string };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Bad request" });
  }

  const queryRaw = typeof body.query === "string" ? sanitizeResearchQuery(body.query) : "";
  const context = typeof body.context === "string" ? body.context.trim().slice(0, RESEARCH_MAX_CONTEXT_CHARS) : "";
  const combined = [queryRaw, context].filter(Boolean).join(" ").trim();
  if (combined.length < RESEARCH_MIN_QUERY_CHARS) {
    return json(400, { error: "Describe what to research (at least a few words)." });
  }
  const query = queryRaw || combined;

  const area = typeof body.area === "string" && body.area.trim() ? body.area.trim() : "General";
  const allowedTemplates: ResearchTemplate[] = ["brief", "competitive", "grant", "evidence"];
  const template =
    typeof body.template === "string" && allowedTemplates.includes(body.template as ResearchTemplate)
      ? (body.template as ResearchTemplate)
      : undefined;

  const usage = getStore({ name: "alfred-research-usage" });
  const who = (session.email ?? sessionId).toLowerCase();
  const usageKey = `${who}:${dayKey(body.timeZone || "America/Los_Angeles")}`;
  const used = Number((await usage.get(usageKey)) ?? 0);
  if (used >= RESEARCH_DAILY_LIMIT) {
    return json(429, { error: "Business Researcher daily limit reached. Try again tomorrow or use Prompt on a task." });
  }

  const client = new Anthropic({ timeout: 22_000, maxRetries: 0 });
  try {
    const { title, report, searched, refused } = await runBusinessResearch(client, {
      query,
      area,
      context,
      template,
    });
    if (refused || !report) {
      return json(422, { error: "Could not complete that research request. Try rephrasing.", searched });
    }

    await usage.set(usageKey, String(used + 1));

    const at = new Date().toISOString();
    const memoId = `research-${Date.now().toString(36)}`;
    const memoText = [
      "📊 **Business Researcher**",
      `**Area:** ${area}`,
      `**Question:** ${query.trim()}`,
      searched ? "_Used live web sources._" : "",
      "",
      report,
    ]
      .filter(Boolean)
      .join("\n");

    const key = await resolveDataKey(sessionId);
    const latest = (await loadUserData(key)) ?? { updatedAt: at };
    const prevHub = (latest.hub ?? {}) as Partial<HubState>;
    const memos: Memo[] = [...(prevHub.memos ?? []), { id: memoId, at, text: memoText }];
    const hub: HubState = { ...EMPTY_HUB, ...prevHub, memos, updatedAt: at };
    await saveUserData(key, { ...latest, hub, updatedAt: at });

    return json(200, {
      title: title || researchMemoTitle(query),
      report,
      searched,
      memoId,
      at,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Research failed";
    return json(502, { error: msg.includes("timeout") ? "Research timed out — try a narrower question." : "Research failed. Try again in a minute." });
  }
};
