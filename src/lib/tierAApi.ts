import { authHeaders } from "./google";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
  return data;
}

export function applyCalendarProposal(proposalId: string, timeZone: string) {
  return post<{ ok: boolean }>("/api/calendar-apply", { proposalId, timeZone });
}

export function placeVoiceCall(callId: string) {
  return post<{ ok: boolean }>("/api/voice-call", { callId });
}

export function runInboxTriage() {
  return post<{ ok: boolean; count: number }>("/api/inbox-triage", {});
}

export function linkSms(phone?: string, enable = true) {
  return post<{ ok: boolean; linkCode: string; hint: string }>("/api/sms-link", { phone, enable });
}

export function ingestWearable(body: {
  source?: "manual" | "oura" | "apple-health";
  sleepHours?: number;
  readiness?: number;
  steps?: number;
  restingHr?: number;
}) {
  return post<{ ok: boolean }>("/api/wearable-ingest", body);
}
