/**
 * ECS channel agents: one lane per brand/business Iris routes through.
 * Phase 1 = registry + drafts + send from configured From (Gmail send-as).
 * Phase 2 = separate OAuth per channel (googleLinked on each channel).
 */
import type { Area } from "./planData";

export type ChannelId =
  | "ecs"
  | "tortuga"
  | "north-star"
  | "easy-supply"
  | "2easy"
  | "personal"
  | "family-purpose";

export type ChannelDraftStatus = "pending" | "sent" | "discarded";

export interface ChannelConfig {
  id: ChannelId;
  /** Matches Plan areas where applicable */
  area: Area;
  displayName: string;
  /** Intended From address (must be a Gmail "send mail as" on the connected account). */
  fromEmail: string;
  replyTo?: string;
  enabled: boolean;
  /** Outbound email allowed (Family Purpose stays off by default). */
  canSend: boolean;
  /** Future: read this inbox when its Google account is linked. */
  readInbox: boolean;
  /** Separate memory/tools boundary for FP (no cross-channel drafts). */
  isolated: boolean;
  notes?: string;
  /** Set when this channel has its own Google OAuth (not built yet). */
  googleLinked?: boolean;
}

export interface ChannelDraft {
  id: string;
  channelId: ChannelId;
  to: string;
  subject: string;
  body: string;
  status: ChannelDraftStatus;
  createdAt: string;
  sentAt?: string;
}

export interface ChannelsState {
  channels: ChannelConfig[];
  drafts: ChannelDraft[];
  updatedAt: string;
}

export const EMPTY_CHANNELS: ChannelsState = {
  channels: [],
  drafts: [],
  updatedAt: new Date(0).toISOString(),
};

const DEFAULT_CHANNEL_ROWS: Omit<ChannelConfig, "fromEmail">[] = [
  { id: "ecs", area: "ECS", displayName: "ECS Network", enabled: true, canSend: true, readInbox: false, isolated: false },
  { id: "tortuga", area: "Tortuga", displayName: "Tortuga / $BAY", enabled: true, canSend: true, readInbox: false, isolated: false },
  { id: "north-star", area: "North Star", displayName: "North Star Network", enabled: true, canSend: true, readInbox: false, isolated: false },
  { id: "easy-supply", area: "Easy Supply", displayName: "Easy Supply Co.", enabled: true, canSend: true, readInbox: false, isolated: false },
  { id: "2easy", area: "2EASY", displayName: "2EASY", enabled: true, canSend: true, readInbox: false, isolated: false },
  { id: "personal", area: "Personal", displayName: "Personal", enabled: true, canSend: true, readInbox: false, isolated: false },
  {
    id: "family-purpose",
    area: "Personal",
    displayName: "Family Purpose (isolated)",
    enabled: true,
    canSend: false,
    readInbox: false,
    isolated: true,
    notes: "No outbound through Iris; student details stay out of other channels.",
  },
];

export function defaultChannels(primaryEmail?: string): ChannelConfig[] {
  const domain = primaryEmail?.includes("@") ? primaryEmail.split("@")[1] : "example.com";
  const guess = (slug: string) => `${slug}@${domain}`;

  return DEFAULT_CHANNEL_ROWS.map((row) => ({
    ...row,
    fromEmail:
      row.id === "personal"
        ? primaryEmail ?? ""
        : row.id === "family-purpose"
          ? ""
          : guess(row.id === "easy-supply" ? "orders" : row.id === "north-star" ? "northstar" : row.id),
  }));
}

export function normalizeChannels(raw: Partial<ChannelsState> | null | undefined, primaryEmail?: string): ChannelsState {
  const base = defaultChannels(primaryEmail);
  if (!raw?.channels?.length) {
    // A fresh device starts "oldest", so the account's real drafts always win.
    return { ...EMPTY_CHANNELS, channels: base, drafts: raw?.drafts ?? [], updatedAt: raw?.updatedAt ?? new Date(0).toISOString() };
  }
  const byId = new Map(raw.channels.map((c) => [c.id, c]));
  const channels = base.map((d) => ({ ...d, ...byId.get(d.id) }));
  return {
    channels,
    drafts: raw.drafts ?? [],
    updatedAt: raw.updatedAt ?? new Date(0).toISOString(),
  };
}

export function channelForArea(area: Area): ChannelId {
  const map: Record<Area, ChannelId> = {
    Tortuga: "tortuga",
    "North Star": "north-star",
    "Easy Supply": "easy-supply",
    "2EASY": "2easy",
    ECS: "ecs",
    Personal: "personal",
  };
  return map[area];
}

export function getChannel(state: ChannelsState, id: ChannelId): ChannelConfig | undefined {
  return state.channels.find((c) => c.id === id);
}

export function pendingDrafts(state: ChannelsState): ChannelDraft[] {
  return state.drafts.filter((d) => d.status === "pending");
}

/** One-line status for Iris context (no student content). */
export function channelsSummary(state: ChannelsState): string | null {
  const pending = pendingDrafts(state);
  if (!pending.length) return null;
  const byChannel = new Map<string, number>();
  for (const d of pending) {
    const name = getChannel(state, d.channelId)?.displayName ?? d.channelId;
    byChannel.set(name, (byChannel.get(name) ?? 0) + 1);
  }
  const parts = [...byChannel.entries()].map(([n, c]) => `${n}: ${c} draft${c === 1 ? "" : "s"}`);
  return `Channel mail waiting for OK: ${parts.join("; ")}.`;
}

export function newDraftId(): string {
  return `draft-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
