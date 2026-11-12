import type { InboxTriageItem } from "../../shared/tierAOps";
import { createScribeDraft } from "./_scribeDraft";
import { loadUserData, saveUserData } from "./_userData";
import { mergeTierA } from "../../shared/tierAOps";

function extractEmail(from: string): string {
  return from.match(/<([^>]+)>/)?.[1] ?? from.match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0] ?? "";
}

export async function queueTriageDraft(
  dataKey: string,
  sessionEmail: string | undefined,
  triageId: string,
): Promise<{ ok: boolean; error?: string; draftId?: string }> {
  const data = await loadUserData(dataKey);
  const item = data?.tierA?.inboxTriage?.find((t) => t.id === triageId);
  if (!item?.suggestedReply) return { ok: false, error: "Triage item not found or no suggested reply." };
  const to = extractEmail(item.from);
  const task = [`Reply regarding: ${item.subject}`, to ? `To: ${to}` : "", `Subject: Re: ${item.subject}`, "", item.suggestedReply].filter(Boolean).join("\n");
  const r = await createScribeDraft(dataKey, sessionEmail, task, item.summary);
  if (!r.ok) return { ok: false, error: r.summary };
  const tierA = mergeTierA(data?.tierA, {});
  tierA.inboxTriage = (tierA.inboxTriage ?? []).map((t) =>
    t.id === triageId ? { ...t, draftQueuedAt: new Date().toISOString() } : t,
  );
  await saveUserData(dataKey, { ...data!, tierA, updatedAt: new Date().toISOString() });
  return { ok: true, draftId: r.draftId };
}
