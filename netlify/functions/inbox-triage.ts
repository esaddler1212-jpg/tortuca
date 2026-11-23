import type { Handler } from "@netlify/functions";
import { looksSchoolRelated } from "../../shared/irisContext";
import { TIER_A_MAX_INBOX_TRIAGE, mergeTierA, newId } from "../../shared/tierAOps";
import { getValidSession, initBlobs, sessionHeader } from "./_shared";
import { loadUserData, resolveDataKey, saveUserData } from "./_userData";

function json(status: number, body: unknown) {
  return { statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

const URGENT = /\b(urgent|asap|deadline|today|action required|final notice|overdue)\b/i;

export const handler: Handler = async (event) => {
  initBlobs(event);
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });
  const sessionId = sessionHeader(event);
  if (!sessionId) return json(401, { error: "Unauthorized" });
  const session = await getValidSession(sessionId);
  if (!session?.refreshToken) return json(401, { error: "Connect Google first." });

  const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&labelIds=INBOX", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!listRes.ok) return json(502, { error: "Gmail error" });
  const list = (await listRes.json()) as { messages?: { id: string }[] };
  const items = [];
  for (const { id } of list.messages ?? []) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } },
    );
    if (!msgRes.ok) continue;
    const msg = (await msgRes.json()) as {
      id: string;
      snippet?: string;
      labelIds?: string[];
      payload?: { headers?: { name: string; value: string }[] };
    };
    const headers = msg.payload?.headers ?? [];
    const get = (n: string) => headers.find((h) => h.name.toLowerCase() === n.toLowerCase())?.value ?? "";
    const subject = get("Subject") || "(No subject)";
    const from = get("From") || "Unknown";
    if (looksSchoolRelated(`${from} ${subject}`)) continue;
    const unread = msg.labelIds?.includes("UNREAD") ?? false;
    const blob = `${subject} ${msg.snippet ?? ""}`;
    const urgency = URGENT.test(blob) || unread ? "high" : "normal";
    const suggestedReply = unread
      ? `Thanks for reaching out — I'll follow up shortly. — Eric`
      : undefined;
    items.push({
      id: newId("tri"),
      threadId: id,
      from: from.replace(/<[^>]+>/, "").trim().slice(0, 80),
      subject: subject.slice(0, 120),
      urgency,
      summary: (msg.snippet ?? subject).slice(0, 200),
      suggestedReply,
      at: new Date().toISOString(),
    });
  }
  items.sort((a, b) => (a.urgency === "high" ? -1 : 1) - (b.urgency === "high" ? -1 : 1));

  const key = await resolveDataKey(sessionId);
  const data = (await loadUserData(key)) ?? { updatedAt: new Date().toISOString() };
  const tierA = mergeTierA(data.tierA, { inboxTriage: items.slice(0, TIER_A_MAX_INBOX_TRIAGE) });
  await saveUserData(key, { ...data, tierA, updatedAt: new Date().toISOString() });
  return json(200, { ok: true, count: tierA.inboxTriage?.length ?? 0 });
};
