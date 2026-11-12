import { channelForArea, getChannel, newDraftId, normalizeChannels, type ChannelId } from "../../shared/channels";
import { loadUserData, saveUserData } from "./_userData";

function inferChannelId(task: string, context: string): ChannelId {
  const blob = `${task}\n${context}`.toLowerCase();
  if (/easy supply|merch|shopify|sweat\s*suit|tracksuit|order confirm|fulfillment/.test(blob)) return "easy-supply";
  if (/north star|northstar/.test(blob)) return "north-star";
  if (/2easy|two easy/.test(blob)) return "2easy";
  if (/tortuga|\$bay|bay token/.test(blob)) return "tortuga";
  if (/family purpose|student/.test(blob)) return "family-purpose";
  if (/ecs network|ecs\b/.test(blob)) return "ecs";
  return channelForArea("Easy Supply");
}

function inferDraftFields(task: string): { to: string; subject: string; body: string } {
  const email = task.match(/[\w.+-]+@[\w.-]+\.\w+/)?.[0] ?? "";
  const subjectMatch = task.match(/subject[:\s]+(.+)/i)?.[1];
  const subject = (subjectMatch ?? task.replace(/\s+/g, " ").trim()).slice(0, 120) || "Follow-up from Easy Supply";
  const body =
    task.length > 24
      ? task.trim()
      : "Hi —\n\nThanks for reaching out to Easy Supply. \n\n\nBest,\nEasy Supply Co.";
  return { to: email, subject, body };
}

export async function createScribeDraft(
  dataKey: string,
  sessionEmail: string | undefined,
  task: string,
  context: string,
): Promise<{ ok: boolean; summary: string; draftId?: string }> {
  const data = (await loadUserData(dataKey)) ?? { updatedAt: new Date().toISOString() };
  const state = normalizeChannels(data.channels as Parameters<typeof normalizeChannels>[0], sessionEmail);
  const channelId = inferChannelId(task, context);
  const ch = getChannel(state, channelId);
  if (!ch?.canSend) {
    return {
      ok: false,
      summary: `Scribe can't draft on ${ch?.displayName ?? channelId} (outbound disabled). Open Drafts to compose manually.`,
    };
  }
  const { to, subject, body } = inferDraftFields(task);
  const draft = {
    id: newDraftId(),
    channelId,
    to,
    subject,
    body,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };
  const next = {
    ...state,
    drafts: [...state.drafts, draft],
    updatedAt: new Date().toISOString(),
  };
  await saveUserData(dataKey, { ...data, channels: next, updatedAt: new Date().toISOString() });
  const toLine = to ? ` to ${to}` : "";
  return {
    ok: true,
    draftId: draft.id,
    summary: `Scribe queued a ${ch.displayName} draft${toLine}: "${subject}". Open Drafts to edit and approve send.`,
  };
}
