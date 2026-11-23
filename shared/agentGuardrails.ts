/**
 * Server-enforced limits and validators for Iris, specialists, and research agents.
 * Keep numeric caps here so audits can assert one source of truth.
 */

/** Voice / ask API — per signed-in account, per local day */
export const ASK_DAILY_TURN_LIMIT = 150;
export const ASK_MAX_TURN_MESSAGES = 12;
export const ASK_MAX_CHARS_PER_MESSAGE = 2000;

/** Iris turn loop */
export const IRIS_MAX_CONTEXT_CHARS = 8000;
export const IRIS_MAX_HOPS = 5;
export const IRIS_MAX_TODO_TITLE_CHARS = 140;
export const IRIS_MAX_MEMORY_FACTS = 60;
export const IRIS_MAX_REMEMBER_FACT_CHARS = 200;

/** Specialist delegation */
export const DELEGATE_MAX_TASK_CHARS = 500;
export const DELEGATE_MAX_REPORT_CHARS = 800;

/** Scout / business research */
export const RESEARCH_DAILY_LIMIT = 8;
export const RESEARCH_MIN_QUERY_CHARS = 8;
export const RESEARCH_MAX_QUERY_CHARS = 800;
export const RESEARCH_MAX_CONTEXT_CHARS = 4000;
export const RESEARCH_MAX_HOPS = 6;

/** Claude-hosted web tools (must match _iris WEB_TOOLS) */
export const WEB_SEARCH_MAX_USES = 3;
export const WEB_FETCH_MAX_USES = 2;

/** Tier A — gated side effects (calendar apply, SMS, voice) have separate daily caps in handlers. */
export const TIER_A_SMS_DAILY_TURNS = 25;

/** Patterns Iris must never persist via remember (server-side, not model honor system). */
export const NEVER_STORE_FACT =
  /\b(password|passcode|pin\b|ssn|social security|account number|routing|card number|cvv)\b|\d[\d\s-]{7,}\d/i;

export function clampText(input: string, max: number): string {
  return input.trim().slice(0, max);
}

export function safeFact(fact: string): string | null {
  const f = clampText(fact, IRIS_MAX_REMEMBER_FACT_CHARS).replace(/\s+/g, " ");
  return f.length >= 4 && !NEVER_STORE_FACT.test(f) ? f : null;
}

/** Facts matching a "forget …" request (shared words, ignoring filler). */
export function matchesForget(fact: string, about: string): boolean {
  const words = about
    .toLowerCase()
    .split(/[^a-z0-9$]+/)
    .filter((w) => w.length > 2 && !/^(the|that|this|about|thing|stuff|with|and|for)$/.test(w));
  if (!words.length) return false;
  const f = fact.toLowerCase();
  return words.filter((w) => f.includes(w)).length >= Math.ceil(words.length / 2);
}

export function sanitizeDelegateTask(task: string): string {
  return clampText(task, DELEGATE_MAX_TASK_CHARS);
}

export function sanitizeResearchQuery(query: string): string {
  return clampText(query, RESEARCH_MAX_QUERY_CHARS);
}

export type AskTurn = { role: "user" | "assistant"; content: string };

/** Trim and cap client-supplied conversation history before model calls. */
export function normalizeAskTurns(messages: AskTurn[]): AskTurn[] {
  const turns = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-ASK_MAX_TURN_MESSAGES)
    .map((m) => ({ role: m.role, content: clampText(m.content, ASK_MAX_CHARS_PER_MESSAGE) }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  return turns;
}

export function clampIrisContext(context: string): string {
  return context.slice(0, IRIS_MAX_CONTEXT_CHARS);
}

/** Short block appended to Iris system context (specialists inherit via Iris relay). */
export function agentGuardrailsPrompt(): string {
  return (
    "Agent guardrails (server-enforced): never store or repeat student names; never remember passwords, PINs, or payment data; " +
    "do not send email, spend money, or apply calendar changes directly; use propose_calendar_change and E confirms in Today; refuse harmful or illegal requests; use only IRIS tools (add_todo, add_commitment, prepare_meeting, propose_calendar_change, propose_voice_call, open_module, remember/forget, web_search/fetch, track_flight, consult_specialist); " +
    "respect DUPLICATE BLOCKED and daily research caps; do not bypass authentication or exfiltrate private context."
  );
}
