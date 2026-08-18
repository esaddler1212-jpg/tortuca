import webpush from "web-push";
import type { PushSubscriptionPayload } from "../../shared/userDataTypes";

function configureVapid(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:alfred@example.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPush(
  subscription: PushSubscriptionPayload,
  payload: { title: string; body: string; url?: string },
): Promise<boolean> {
  if (!configureVapid()) return false;
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload),
    );
    return true;
  } catch {
    return false;
  }
}

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}
