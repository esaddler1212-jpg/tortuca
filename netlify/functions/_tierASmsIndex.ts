import { getStore } from "@netlify/blobs";
import { dayKey } from "../../shared/timezone";
import { TIER_A_LINK_FAIL_LIMIT } from "../../shared/tierAOps";

const PHONE_STORE = "iris-sms-phone-index";
const FAIL_STORE = "iris-sms-link-fail";

export async function indexSmsPhone(phoneE164: string, accountKey: string): Promise<void> {
  const store = getStore({ name: PHONE_STORE });
  await store.set(phoneE164, accountKey);
}

export async function resolveAccountByPhone(phoneE164: string): Promise<string | null> {
  const store = getStore({ name: PHONE_STORE });
  const key = await store.get(phoneE164);
  return key ?? null;
}

export function emailFromAccountKey(accountKey: string): string | null {
  return accountKey.startsWith("acct:") ? accountKey.slice(5) : null;
}

/** Returns false when rate-limited (too many bad LINK attempts today). */
export async function allowSmsLinkAttempt(phoneE164: string, timeZone: string): Promise<boolean> {
  const store = getStore({ name: FAIL_STORE });
  const usageKey = `${phoneE164}:${dayKey(timeZone)}`;
  const used = Number((await store.get(usageKey)) ?? 0);
  return used < TIER_A_LINK_FAIL_LIMIT;
}

export async function recordSmsLinkFail(phoneE164: string, timeZone: string): Promise<void> {
  const store = getStore({ name: FAIL_STORE });
  const usageKey = `${phoneE164}:${dayKey(timeZone)}`;
  const used = Number((await store.get(usageKey)) ?? 0);
  await store.set(usageKey, String(used + 1));
}
