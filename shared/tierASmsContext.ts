import { clampIrisContext } from "./agentGuardrails";
import { inboxContext } from "./irisContext";
import { tierAContextForIris } from "./tierAOps";
import type { AlfredUserData } from "./userDataTypes";

export function buildTierASmsContext(
  data: AlfredUserData,
  opts: {
    timeZone: string;
    schoolNames?: string[];
    inbox?: { from: string; subject: string; date: string; unread: boolean }[];
  },
): string {
  const open = (data.todos ?? []).filter((t) => !t.done);
  const lines = [
    "Channel: SMS. One to three short sentences. Never student names or Family Purpose details.",
    data.settings?.city ? `City: ${data.settings.city}.` : "",
    tierAContextForIris(data.tierA),
    open.length
      ? `Do today (${open.length} open): ${open
          .slice(0, 5)
          .map((t) => t.title)
          .join("; ")}.`
      : "Do today: clear.",
    opts.inbox?.length
      ? inboxContext(opts.inbox, opts.timeZone, { schoolNames: opts.schoolNames, limit: 6 })
      : "",
    (data.irisMemory ?? []).length
      ? `Remembered about E: ${(data.irisMemory ?? [])
          .slice(-8)
          .map((m) => m.fact)
          .join("; ")}.`
      : "",
  ];
  return clampIrisContext(lines.filter(Boolean).join("\n"));
}
