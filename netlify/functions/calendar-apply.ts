import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { TIER_A_CALENDAR_DAILY } from "../../shared/tierAOps";
import { dayKey } from "../../shared/timezone";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";
import { applyCalendarProposal } from "./_tierACalendar";

function json(status: number, body: unknown) {
  return { statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export const handler: Handler = async (event) => {
  initBlobs(event);
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });
  const sessionId = sessionHeader(event);
  if (!sessionId) return json(401, { error: "Unauthorized" });
  const session = await getValidSession(sessionId);
  if (!session?.refreshToken) return json(401, { error: "Connect Google first." });

  let body: { proposalId?: string; timeZone?: string };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Bad request" });
  }
  const proposalId = body.proposalId?.trim();
  if (!proposalId) return json(400, { error: "proposalId required" });

  const key = await resolveDataKey(sessionId);
  const data = await loadUserData(key);
  if (!data?.tierA?.calendarProposals?.length) return json(404, { error: "No proposals" });
  const proposal = data.tierA.calendarProposals.find((p) => p.id === proposalId && p.status === "pending");
  if (!proposal) return json(404, { error: "Proposal not found" });

  const tz = body.timeZone || data.settings?.timezone || "America/Los_Angeles";
  const who = (session.email ?? sessionId).toLowerCase();
  const usage = getStore({ name: "iris-tier-a-calendar" });
  const usageKey = `${who}:${dayKey(tz)}`;
  const used = Number((await usage.get(usageKey)) ?? 0);
  if (used >= TIER_A_CALENDAR_DAILY) return json(429, { error: "Calendar change limit for today." });

  const result = await applyCalendarProposal(session, proposal);
  if (!result.ok) return json(502, { error: result.error ?? "Calendar API failed" });

  await usage.set(usageKey, String(used + 1));
  const now = new Date().toISOString();
  const calendarProposals = data.tierA.calendarProposals.map((p) =>
    p.id === proposalId ? { ...p, status: "applied" as const, appliedAt: now } : p,
  );
  await saveUserData(key, {
    ...data,
    tierA: { ...data.tierA, calendarProposals },
    updatedAt: now,
  });
  return json(200, { ok: true });
};
