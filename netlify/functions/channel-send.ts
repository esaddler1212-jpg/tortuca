import type { Handler } from "@netlify/functions";
import { getValidSession, initBlobs, sendGmail, sessionHeader } from "./_shared";
import { getChannel, normalizeChannels, type ChannelDraft, type ChannelsState } from "../../shared/channels";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";

/** POST /api/channel-send — send an approved channel draft (Gmail send-as From when set). */

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export const handler: Handler = async (event) => {
  initBlobs(event);
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });

  const sessionId = sessionHeader(event);
  const session = sessionId ? await getValidSession(sessionId) : null;
  if (!sessionId || !session) return json(401, { error: "Connect Google first." });

  let body: { draftId?: string };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return json(400, { error: "Bad request" });
  }
  const draftId = body.draftId?.trim();
  if (!draftId) return json(400, { error: "Missing draftId" });

  const key = await resolveDataKey(sessionId);
  const latest = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
  const channels = normalizeChannels(latest.channels as ChannelsState | undefined, session.email);
  const draft = channels.drafts.find((d) => d.id === draftId && d.status === "pending");
  if (!draft) return json(404, { error: "Draft not found or already handled." });

  const channel = getChannel(channels, draft.channelId);
  if (!channel?.enabled || !channel.canSend) {
    return json(403, { error: "This channel cannot send mail through Iris." });
  }
  if (channel.isolated && draft.channelId === "family-purpose") {
    return json(403, { error: "Family Purpose channel is isolated — outbound disabled." });
  }

  if (!draft.to.trim()) return json(400, { error: "Add a recipient before sending." });
  const text = draft.body.trim();
  const html = text
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const ok = await sendGmail(session, draft.to.trim(), draft.subject.trim(), html, text, {
    from: from || undefined,
    replyTo: channel.replyTo?.trim() || from || undefined,
  });

  if (!ok) {
    return json(502, {
      error:
        "Gmail rejected the send. Is the From address set up as Send mail as on your Google account?",
    });
  }

  const at = new Date().toISOString();
  const drafts: ChannelDraft[] = channels.drafts.map((d) =>
    d.id === draftId ? { ...d, status: "sent" as const, sentAt: at } : d,
  );
  const next: ChannelsState = { ...channels, drafts, updatedAt: at };
  await saveUserData(key, { ...latest, channels: next, updatedAt: at });

  return json(200, { ok: true, sentAt: at });
};
