import type { UserSettings, TodoItem } from "../types";
import type { AlfredUserData, SyncedUserSettings } from "../../shared/userDataTypes";
import { authHeaders, ensureSession } from "./google";

export function toSyncedSettings(settings: UserSettings): SyncedUserSettings {
  return {
    city: settings.city,
    latitude: settings.latitude,
    longitude: settings.longitude,
    timezone: settings.timezone,
    briefingHour: settings.briefingHour,
    commuteMinutes: settings.commuteMinutes,
    arriveBufferMinutes: settings.arriveBufferMinutes,
    schoolStartTime: settings.schoolStartTime,
    schoolName: settings.schoolName,
    schoolGrade: settings.schoolGrade,
    eveningWrapHour: settings.eveningWrapHour,
    weeklyReviewHour: settings.weeklyReviewHour,
    homeAddress: settings.homeAddress,
    schoolAddress: settings.schoolAddress,
    useLiveCommute: settings.useLiveCommute,
    morningDigestEnabled: settings.morningDigestEnabled,
    pushNotificationsEnabled: settings.pushNotificationsEnabled,
    wakeTime: settings.wakeTime,
    morningWorkoutDeadlineHour: settings.morningWorkoutDeadlineHour,
    fitnessSuggestTime: settings.fitnessSuggestTime,
    targetSleepHours: settings.targetSleepHours,
    windDownMinutes: settings.windDownMinutes,
    morningRoutineMinutes: settings.morningRoutineMinutes,
    weekendWakeTime: settings.weekendWakeTime,
  };
}

export async function fetchUserData(): Promise<AlfredUserData | null> {
  await ensureSession();
  const res = await fetch("/api/user-data", { headers: authHeaders() });
  if (!res.ok) return null;
  return (await res.json()) as AlfredUserData;
}

export async function saveUserDataRemote(patch: Partial<AlfredUserData>): Promise<AlfredUserData | null> {
  await ensureSession();
  const res = await fetch("/api/user-data", {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return null;
  return (await res.json()) as AlfredUserData;
}

export async function syncSettings(settings: UserSettings): Promise<void> {
  await saveUserDataRemote({ settings: toSyncedSettings(settings) });
}

export async function syncTodos(todos: TodoItem[]): Promise<void> {
  await saveUserDataRemote({ todos });
}

export async function syncFitness(logs: import("../types").FitnessLog[]): Promise<void> {
  await saveUserDataRemote({ fitnessLogs: logs });
}

export async function fetchLiveCommuteMinutes(
  origin: string,
  destination: string,
): Promise<number | null> {
  const url = new URL("/api/commute", window.location.origin);
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { minutes?: number | null };
  return data.minutes ?? null;
}

export async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch("/api/push-vapid");
    if (!res.ok) return null;
    const data = (await res.json()) as { publicKey: string | null };
    return data.publicKey;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function subscribeToPush(): Promise<PushSubscriptionJSON | null> {
  const publicKey = await fetchVapidPublicKey();
  if (!publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  return sub.toJSON();
}

export async function savePushSubscription(sub: PushSubscriptionJSON): Promise<void> {
  const json = sub as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
  await saveUserDataRemote({
    pushSubscription: {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    },
  });
}
