import { useCallback, useEffect, useRef, useState } from "react";
import {
  getChannel,
  newDraftId,
  normalizeChannels,
  pendingDrafts,
  channelForArea,
  type ChannelConfig,
  type ChannelDraft,
  type ChannelId,
  type ChannelsState,
} from "../../shared/channels";
import type { Area } from "../../shared/planData";
import { fetchUserData, saveUserDataRemote } from "../lib/userData";
import { onRemoteData } from "../lib/remoteSync";
import { authHeaders, ensureSession } from "../lib/google";
import { loadJson, saveJson } from "../lib/storage";

const CHANNELS_KEY = "alfred-channels-v1";

export function useChannels(accountEmail?: string) {
  const [state, setState] = useState<ChannelsState>(() =>
    normalizeChannels(loadJson<ChannelsState | null>(CHANNELS_KEY, null), accountEmail),
  );
  const loadedRemote = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fromRemote = useRef(false);
  const lastPushed = useRef("");
  const latest = useRef(state);
  latest.current = state;

  // Another device changed it: take the newer copy (unless an edit here is about to save).
  useEffect(
    () =>
      onRemoteData((data) => {
        const remote = data.channels as ChannelsState | undefined;
        if (!remote || timer.current || !(remote.updatedAt > latest.current.updatedAt)) return;
        fromRemote.current = true;
        setState(normalizeChannels(remote, accountEmail));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    setState((s) => normalizeChannels(s, accountEmail));
  }, [accountEmail]);

  useEffect(() => {
    void (async () => {
      try {
        const remote = (await fetchUserData())?.channels as ChannelsState | undefined;
        if (remote && remote.updatedAt > state.updatedAt) {
          const next = normalizeChannels(remote, accountEmail);
          lastPushed.current = JSON.stringify(next);
          setState(next);
        } else {
          lastPushed.current = JSON.stringify(latest.current);
        }
      } catch {
        /* offline */
      } finally {
        loadedRemote.current = true;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveJson(CHANNELS_KEY, state);
    if (!loadedRemote.current) return;
    if (fromRemote.current) {
      fromRemote.current = false;
      lastPushed.current = JSON.stringify(state);
      return;
    }
    // Re-applying the same content (e.g. on sign-in) isn't an edit.
    if (JSON.stringify(state) === lastPushed.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      lastPushed.current = JSON.stringify(state);
      void saveUserDataRemote({ channels: state }).catch(() => undefined);
    }, 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state]);

  const update = useCallback((fn: (s: ChannelsState) => ChannelsState) => {
    setState((s) => ({ ...fn(s), updatedAt: new Date().toISOString() }));
  }, []);

  const saveChannel = useCallback(
    (id: ChannelId, patch: Partial<Pick<ChannelConfig, "fromEmail" | "replyTo" | "enabled" | "notes">>) => {
      update((s) => ({
        ...s,
        channels: s.channels.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
    },
    [update],
  );

  const addDraft = useCallback(
    (draft: Omit<ChannelDraft, "id" | "status" | "createdAt">) => {
      update((s) => {
        const channel = getChannel(s, draft.channelId);
        if (!channel?.canSend) return s;
        const row: ChannelDraft = {
          ...draft,
          id: newDraftId(),
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        return { ...s, drafts: [...s.drafts, row] };
      });
    },
    [update],
  );

  const addDraftForArea = useCallback(
    (area: Area, to: string, subject: string, body: string) => {
      addDraft({ channelId: channelForArea(area), to, subject, body });
    },
    [addDraft],
  );

  const discardDraft = useCallback(
    (id: string) => {
      update((s) => ({
        ...s,
        drafts: s.drafts.map((d) => (d.id === id ? { ...d, status: "discarded" as const } : d)),
      }));
    },
    [update],
  );

  const sendDraft = useCallback(
    async (id: string): Promise<string | null> => {
      await ensureSession();
      const res = await fetch("/api/channel-send", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ draftId: id }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) return data.error ?? "Send failed";
      update((s) => ({
        ...s,
        drafts: s.drafts.map((d) =>
          d.id === id ? { ...d, status: "sent" as const, sentAt: new Date().toISOString() } : d,
        ),
      }));
      return null;
    },
    [update],
  );

  return {
    channels: state,
    pending: pendingDrafts(state),
    saveChannel,
    addDraft,
    addDraftForArea,
    discardDraft,
    sendDraft,
  };
}
