import {
  TIER_A_MAX_CALENDAR_PROPOSALS,
  TIER_A_MAX_COMMITMENTS,
  TIER_A_MAX_MEETING_PREPS,
  TIER_A_MAX_VOICE_CALLS,
  newId,
  mergeTierA,
  type CalendarProposal,
  type CalendarProposalKind,
  type Commitment,
  type MeetingPrepPack,
  type TierAState,
  type VoiceCallProposal,
} from "../../shared/tierAOps";

export type TierAToolBatch = {
  commitments: Array<{ promise: string; owed_to: string; due?: string }>;
  meetingPreps: Array<{
    title: string;
    objective: string;
    talking_points: string[];
    risks: string[];
    event_id?: string;
    starts_at?: string;
  }>;
  calendarProposals: Array<{
    kind: CalendarProposalKind;
    title: string;
    event_id?: string;
    start?: string;
    end?: string;
    new_start?: string;
    new_end?: string;
    location?: string;
    description?: string;
  }>;
  voiceCalls: Array<{ to_number: string; label: string; script: string }>;
};

const phoneOk = (s: string) => /^\+?[1-9]\d{7,14}$/.test(s.replace(/[\s()-]/g, ""));

export function applyTierATools(prev: TierAState | undefined, batch: TierAToolBatch): TierAState {
  const now = new Date().toISOString();
  let tierA = mergeTierA(prev, {});

  for (const c of batch.commitments) {
    const promise = c.promise?.trim().slice(0, 200);
    const owedTo = c.owed_to?.trim().slice(0, 80);
    if (!promise || !owedTo) continue;
    const row: Commitment = {
      id: newId("cmt"),
      promise,
      owedTo,
      dueDate: c.due?.trim().slice(0, 10) || undefined,
      done: false,
      createdAt: now,
    };
    tierA.commitments = [...(tierA.commitments ?? []), row].slice(-TIER_A_MAX_COMMITMENTS);
  }

  for (const m of batch.meetingPreps) {
    const title = m.title?.trim().slice(0, 120);
    if (!title) continue;
    const pack: MeetingPrepPack = {
      id: newId("prep"),
      eventId: m.event_id?.trim() || undefined,
      title,
      startsAt: m.starts_at?.trim() || undefined,
      objective: m.objective?.trim().slice(0, 400) || "Align on outcomes.",
      talkingPoints: (m.talking_points ?? []).map((t) => String(t).trim().slice(0, 160)).filter(Boolean).slice(0, 6),
      risks: (m.risks ?? []).map((t) => String(t).trim().slice(0, 160)).filter(Boolean).slice(0, 4),
      createdAt: now,
    };
    tierA.meetingPreps = [...(tierA.meetingPreps ?? []), pack].slice(-TIER_A_MAX_MEETING_PREPS);
  }

  for (const p of batch.calendarProposals) {
    const title = p.title?.trim().slice(0, 120);
    const kind = p.kind;
    if (!title || !kind) continue;
    const proposal: CalendarProposal = {
      id: newId("cal"),
      kind,
      status: "pending",
      title,
      eventId: p.event_id?.trim() || undefined,
      start: p.start?.trim() || undefined,
      end: p.end?.trim() || undefined,
      newStart: p.new_start?.trim() || undefined,
      newEnd: p.new_end?.trim() || undefined,
      location: p.location?.trim().slice(0, 200) || undefined,
      description: p.description?.trim().slice(0, 400) || undefined,
      createdAt: now,
    };
    tierA.calendarProposals = [...(tierA.calendarProposals ?? []), proposal].slice(-TIER_A_MAX_CALENDAR_PROPOSALS);
  }

  for (const v of batch.voiceCalls) {
    const raw = v.to_number?.trim() ?? "";
    const normalized = raw.replace(/[\s()-]/g, "");
    if (!phoneOk(normalized)) continue;
    const script = v.script?.trim().slice(0, 800);
    const label = v.label?.trim().slice(0, 80) || "Call";
    if (!script) continue;
    const call: VoiceCallProposal = {
      id: newId("call"),
      toNumber: normalized.startsWith("+") ? normalized : `+1${normalized.replace(/^\+/, "")}`,
      label,
      script,
      status: "pending",
      createdAt: now,
    };
    tierA.voiceCalls = [...(tierA.voiceCalls ?? []), call].slice(-TIER_A_MAX_VOICE_CALLS);
  }

  return tierA;
}

export function emptyTierABatch(): TierAToolBatch {
  return { commitments: [], meetingPreps: [], calendarProposals: [], voiceCalls: [] };
}

export function tierABatchEmpty(b: TierAToolBatch): boolean {
  return !b.commitments.length && !b.meetingPreps.length && !b.calendarProposals.length && !b.voiceCalls.length;
}
