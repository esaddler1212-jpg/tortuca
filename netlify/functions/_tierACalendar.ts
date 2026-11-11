import type { StoredSession } from "./_shared";
import type { CalendarProposal } from "../../shared/tierAOps";

const TZ = "America/Los_Angeles";

export async function applyCalendarProposal(session: StoredSession, proposal: CalendarProposal): Promise<{ ok: boolean; error?: string }> {
  const auth = { Authorization: `Bearer ${session.accessToken}` };
  const base = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

  if (proposal.kind === "decline" && proposal.eventId) {
    const res = await fetch(`${base}/${encodeURIComponent(proposal.eventId)}`, { method: "DELETE", headers: auth });
    return res.ok || res.status === 410 ? { ok: true } : { ok: false, error: `Calendar delete ${res.status}` };
  }

  if (proposal.kind === "move" && proposal.eventId) {
    const patch: { start?: { dateTime: string; timeZone: string }; end?: { dateTime: string; timeZone: string } } = {};
    if (proposal.newStart) patch.start = { dateTime: proposal.newStart, timeZone: TZ };
    if (proposal.newEnd) patch.end = { dateTime: proposal.newEnd, timeZone: TZ };
    const res = await fetch(`${base}/${encodeURIComponent(proposal.eventId)}`, {
      method: "PATCH",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return res.ok ? { ok: true } : { ok: false, error: `Calendar patch ${res.status}` };
  }

  if (proposal.kind === "create") {
    if (!proposal.start || !proposal.end) return { ok: false, error: "Start and end required" };
    const event = {
      summary: proposal.title,
      location: proposal.location,
      description: proposal.description,
      start: { dateTime: proposal.start, timeZone: TZ },
      end: { dateTime: proposal.end, timeZone: TZ },
    };
    const res = await fetch(base, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    return res.ok ? { ok: true } : { ok: false, error: `Calendar create ${res.status}` };
  }

  return { ok: false, error: "Unsupported proposal" };
}
