import type { StoredSession } from "./_shared";

export async function fetchInboxHeadlines(
  session: StoredSession,
  max = 12,
): Promise<{ from: string; subject: string; date: string; unread: boolean }[]> {
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}&labelIds=INBOX`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } },
  );
  if (!listRes.ok) return [];
  const list = (await listRes.json()) as { messages?: { id: string }[] };
  const out: { from: string; subject: string; date: string; unread: boolean }[] = [];
  for (const { id } of list.messages ?? []) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } },
    );
    if (!msgRes.ok) continue;
    const msg = (await msgRes.json()) as {
      labelIds?: string[];
      payload?: { headers?: { name: string; value: string }[] };
      internalDate?: string;
    };
    const headers = msg.payload?.headers ?? [];
    const get = (n: string) => headers.find((h) => h.name.toLowerCase() === n.toLowerCase())?.value ?? "";
    const dateRaw = get("Date");
    const date = dateRaw
      ? new Date(dateRaw).toISOString()
      : msg.internalDate
        ? new Date(Number(msg.internalDate)).toISOString()
        : new Date().toISOString();
    out.push({
      from: get("From") || "Unknown",
      subject: get("Subject") || "(No subject)",
      date,
      unread: msg.labelIds?.includes("UNREAD") ?? false,
    });
  }
  return out;
}
