import { getStore } from "@netlify/blobs";
import { dayKey } from "../../shared/timezone";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";
import { EMPTY_HUB, type HubState, type Memo } from "../../shared/hub";

export const RESEARCH_DAILY_LIMIT = 8;

export async function researchUsageCount(who: string, timeZone: string): Promise<number> {
  const usage = getStore({ name: "alfred-research-usage" });
  const usageKey = `${who.toLowerCase()}:${dayKey(timeZone || "America/Los_Angeles")}`;
  return Number((await usage.get(usageKey)) ?? 0);
}

export async function incrementResearchUsage(who: string, timeZone: string): Promise<void> {
  const usage = getStore({ name: "alfred-research-usage" });
  const usageKey = `${who.toLowerCase()}:${dayKey(timeZone || "America/Los_Angeles")}`;
  const used = Number((await usage.get(usageKey)) ?? 0);
  await usage.set(usageKey, String(used + 1));
}

export async function appendHubMemo(
  sessionId: string,
  memoText: string,
  memoIdPrefix = "memo",
): Promise<{ memoId: string; at: string }> {
  const at = new Date().toISOString();
  const memoId = `${memoIdPrefix}-${Date.now().toString(36)}`;
  const key = await resolveDataKey(sessionId);
  const latest = (await loadUserData(key)) ?? { updatedAt: at };
  const prevHub = (latest.hub ?? {}) as Partial<HubState>;
  const memos: Memo[] = [...(prevHub.memos ?? []), { id: memoId, at, text: memoText }];
  const hub: HubState = { ...EMPTY_HUB, ...prevHub, memos, updatedAt: at };
  await saveUserData(key, { ...latest, hub, updatedAt: at });
  return { memoId, at };
}
