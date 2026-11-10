/**
 * Tier A executive-assistant capabilities: meeting prep, gated calendar,
 * commitments, inbox triage, SMS, voice calls, briefing prefs, wearables.
 */

export const TIER_A_MAX_COMMITMENTS = 40;
export const TIER_A_MAX_CALENDAR_PROPOSALS = 8;
export const TIER_A_MAX_MEETING_PREPS = 12;
export const TIER_A_MAX_INBOX_TRIAGE = 20;
export const TIER_A_MAX_VOICE_CALLS = 5;
export const TIER_A_SMS_DAILY_TURNS = 25;
export const TIER_A_CALENDAR_DAILY = 15;

export type BriefingSectionId =
  | "weather"
  | "inbox"
  | "todos"
  | "schedule"
  | "woodhouse"
  | "stocks"
  | "wearable"
  | "commitments"
  | "pulse";

export interface BriefingSectionPref {
  id: BriefingSectionId;
  weight: number;
  hidden?: boolean;
}

export interface MeetingPrepPack {
  id: string;
  eventId?: string;
  title: string;
  startsAt?: string;
  objective: string;
  talkingPoints: string[];
  risks: string[];
  createdAt: string;
  rehearsalNote?: string;
}

export type CalendarProposalKind = "create" | "move" | "decline";

export interface CalendarProposal {
  id: string;
  kind: CalendarProposalKind;
  status: "pending" | "applied" | "discarded";
  title: string;
  eventId?: string;
  start?: string;
  end?: string;
  newStart?: string;
  newEnd?: string;
  location?: string;
  description?: string;
  createdAt: string;
  appliedAt?: string;
}

export interface Commitment {
  id: string;
  promise: string;
  owedTo: string;
  dueDate?: string;
  done: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface InboxTriageItem {
  id: string;
  threadId?: string;
  from: string;
  subject: string;
  urgency: "high" | "normal" | "low";
  summary: string;
  suggestedReply?: string;
  draftQueuedAt?: string;
  at: string;
}

export interface WearableSnapshot {
  source: "manual" | "oura" | "apple-health";
  sleepHours?: number;
  readiness?: number;
  steps?: number;
  restingHr?: number;
  updatedAt: string;
}

export interface VoiceCallProposal {
  id: string;
  toNumber: string;
  label: string;
  script: string;
  status: "pending" | "placed" | "discarded";
  createdAt: string;
  placedAt?: string;
}

export interface SmsLinkState {
  enabled: boolean;
  phoneE164?: string;
  linkCode?: string;
  linkedAt?: string;
  lastDigestDate?: string;
}

export interface TierAState {
  briefingPrefs?: BriefingSectionPref[];
  meetingPreps?: MeetingPrepPack[];
  calendarProposals?: CalendarProposal[];
  commitments?: Commitment[];
  inboxTriage?: InboxTriageItem[];
  wearable?: WearableSnapshot | null;
  voiceCalls?: VoiceCallProposal[];
  sms?: SmsLinkState;
}

export const DEFAULT_BRIEFING_PREFS: BriefingSectionPref[] = [
  { id: "weather", weight: 1 },
  { id: "inbox", weight: 1 },
  { id: "todos", weight: 1 },
  { id: "schedule", weight: 1 },
  { id: "woodhouse", weight: 0.8 },
  { id: "stocks", weight: 0.6 },
  { id: "wearable", weight: 0.5 },
  { id: "commitments", weight: 0.9 },
  { id: "pulse", weight: 0.7 },
];

export function defaultTierA(): TierAState {
  return { briefingPrefs: [...DEFAULT_BRIEFING_PREFS], wearable: null };
}

export function mergeTierA(prev: TierAState | undefined, patch: Partial<TierAState> | undefined): TierAState {
  const base = { ...defaultTierA(), ...prev };
  if (!patch) return base;
  return {
    ...base,
    ...patch,
    briefingPrefs: patch.briefingPrefs ?? base.briefingPrefs,
    meetingPreps: patch.meetingPreps ?? base.meetingPreps,
    calendarProposals: patch.calendarProposals ?? base.calendarProposals,
    commitments: patch.commitments ?? base.commitments,
    inboxTriage: patch.inboxTriage ?? base.inboxTriage,
    wearable: patch.wearable !== undefined ? patch.wearable : base.wearable,
    voiceCalls: patch.voiceCalls ?? base.voiceCalls,
    sms: patch.sms ? { ...base.sms, ...patch.sms } : base.sms,
  };
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function bumpBriefingPref(prefs: BriefingSectionPref[] | undefined, id: BriefingSectionId, delta: number): BriefingSectionPref[] {
  const list = prefs?.length ? prefs.map((p) => ({ ...p })) : DEFAULT_BRIEFING_PREFS.map((p) => ({ ...p }));
  const row = list.find((p) => p.id === id) ?? { id, weight: 1 };
  if (!list.find((p) => p.id === id)) list.push(row);
  row.weight = Math.max(0.1, Math.min(2, row.weight + delta));
  return list;
}

export interface BriefingLine {
  section: BriefingSectionId;
  text: string;
}

/** Order briefing lines by weight (adaptive morning briefing). */
export function orderBriefingLines(
  lines: BriefingLine[],
  prefs: BriefingSectionPref[] | undefined,
): BriefingLine[] {
  const map = new Map((prefs ?? DEFAULT_BRIEFING_PREFS).map((p) => [p.id, p]));
  return lines
    .filter((l) => !map.get(l.section)?.hidden)
    .sort((a, b) => (map.get(b.section)?.weight ?? 1) - (map.get(a.section)?.weight ?? 1));
}

export function tierAContextForIris(tierA: TierAState | undefined): string {
  if (!tierA) return "";
  const parts: string[] = [];
  const pendingCal = (tierA.calendarProposals ?? []).filter((p) => p.status === "pending");
  if (pendingCal.length) {
    parts.push(
      `Calendar proposals awaiting E's OK (${pendingCal.length}): ${pendingCal
        .slice(0, 3)
        .map((p) => `${p.kind} "${p.title}"`)
        .join("; ")}.`,
    );
  }
  const open = (tierA.commitments ?? []).filter((c) => !c.done);
  if (open.length) {
    parts.push(
      `Open commitments (${open.length}): ${open
        .slice(0, 4)
        .map((c) => `${c.promise} (to ${c.owedTo}${c.dueDate ? ` by ${c.dueDate}` : ""})`)
        .join("; ")}.`,
    );
  }
  const prep = (tierA.meetingPreps ?? []).slice(-2);
  if (prep.length) {
    parts.push(`Meeting prep packs: ${prep.map((p) => p.title).join(", ")}.`);
  }
  const triage = (tierA.inboxTriage ?? []).filter((t) => t.urgency === "high").slice(0, 3);
  if (triage.length) {
    parts.push(`Inbox triage (high): ${triage.map((t) => `${t.from}: ${t.subject}`).join("; ")}.`);
  }
  const calls = (tierA.voiceCalls ?? []).filter((v) => v.status === "pending");
  if (calls.length) parts.push(`${calls.length} outbound call script(s) waiting for approval.`);
  if (tierA.wearable?.updatedAt) {
    const w = tierA.wearable;
    const bits = [
      w.sleepHours != null ? `sleep ${w.sleepHours}h` : "",
      w.readiness != null ? `readiness ${w.readiness}` : "",
      w.steps != null ? `${w.steps} steps` : "",
    ].filter(Boolean);
    if (bits.length) parts.push(`Wearable (${w.source}): ${bits.join(", ")}.`);
  }
  return parts.length ? `Tier A ops: ${parts.join(" ")}` : "";
}
