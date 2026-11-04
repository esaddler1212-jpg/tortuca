import { getStore } from "@netlify/blobs";
import { addTrace, emptyMonth, type IrisTrace, type IrisUsageMonth } from "../../shared/irisUsage";
import { dayKey } from "../../shared/timezone";

/** One record per account per month, in its own store (kept apart from user data). */
const store = () => getStore({ name: "iris-usage" });
const keyFor = (who: string, month: string) => `${who.toLowerCase()}:${month}`;

export async function loadUsage(who: string, month: string): Promise<IrisUsageMonth> {
  const raw = (await store().get(keyFor(who, month), { type: "json" }).catch(() => null)) as IrisUsageMonth | null;
  return raw && Array.isArray(raw.traces) && raw.days ? raw : emptyMonth(month);
}

/** Record one turn. Never throws: logging must not break a conversation. */
export async function recordUsage(who: string, trace: IrisTrace, timeZone: string): Promise<void> {
  try {
    const day = dayKey(timeZone);
    const month = day.slice(0, 7);
    const log = await loadUsage(who, month);
    await store().setJSON(keyFor(who, month), addTrace(log, trace, day));
  } catch {
    /* usage log is best effort */
  }
}
