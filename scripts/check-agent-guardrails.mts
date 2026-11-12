/** Agent guardrails — limits, safeFact, and wiring audits. Run: npm run test:guardrails */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ASK_DAILY_TURN_LIMIT,
  DELEGATE_MAX_REPORT_CHARS,
  DELEGATE_MAX_TASK_CHARS,
  IRIS_MAX_CONTEXT_CHARS,
  IRIS_MAX_HOPS,
  IRIS_MAX_MEMORY_FACTS,
  IRIS_MAX_TODO_TITLE_CHARS,
  RESEARCH_DAILY_LIMIT,
  RESEARCH_MIN_QUERY_CHARS,
  agentGuardrailsPrompt,
  clampIrisContext,
  matchesForget,
  normalizeAskTurns,
  safeFact,
  sanitizeDelegateTask,
} from "../shared/agentGuardrails.ts";
import { teamContextForIris } from "../shared/irisTeam.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

let checkCount = 0;
const ok = (name: string, cond: boolean) => {
  checkCount++;
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
};

// ── Shared validators ───────────────────────────────────────────────────
ok("safeFact blocks PINs", safeFact("E's bank PIN is 4821") === null);
ok("safeFact allows preferences", safeFact("E likes short briefs") !== null);
ok("matchesForget by topic", matchesForget("E trains legs on Thursday at the gym", "the gym schedule"));
ok("sanitizeDelegateTask caps length", sanitizeDelegateTask("x".repeat(900)).length === DELEGATE_MAX_TASK_CHARS);
ok("normalizeAskTurns drops leading assistant", normalizeAskTurns([{ role: "assistant", content: "hi" }, { role: "user", content: "hey" }]).length === 1);
ok("clampIrisContext respects cap", clampIrisContext("a".repeat(IRIS_MAX_CONTEXT_CHARS + 500)).length === IRIS_MAX_CONTEXT_CHARS);
ok("agentGuardrailsPrompt mentions student privacy", agentGuardrailsPrompt().includes("student"));
ok("teamContext includes guardrails block", teamContextForIris().includes("Agent guardrails"));

// ── Numeric caps (sanity) ───────────────────────────────────────────────
ok("ASK daily limit reasonable", ASK_DAILY_TURN_LIMIT >= 50 && ASK_DAILY_TURN_LIMIT <= 500);
ok("research daily limit matches scout", RESEARCH_DAILY_LIMIT === 8);
ok("Iris hop cap", IRIS_MAX_HOPS >= 3 && IRIS_MAX_HOPS <= 8);
ok("memory fact cap", IRIS_MAX_MEMORY_FACTS >= 20 && IRIS_MAX_MEMORY_FACTS <= 120);

// ── Repo policy doc ─────────────────────────────────────────────────────
ok("AGENTS.md exists", fs.existsSync(path.join(root, "AGENTS.md")));
ok("AGENTS.md references agentGuardrails", read("AGENTS.md").includes("agentGuardrails.ts"));
ok("AGENTS.md requires test:os", read("AGENTS.md").includes("test:os"));

// ── Server wiring (single source of truth) ────────────────────────────
const askTs = read("netlify/functions/ask.ts");
const irisTs = read("netlify/functions/_iris.ts");
ok("ask imports ASK_DAILY_TURN_LIMIT", askTs.includes("ASK_DAILY_TURN_LIMIT"));
ok("ask uses normalizeAskTurns", askTs.includes("normalizeAskTurns"));
ok("ask clamps Iris context", askTs.includes("clampIrisContext"));
ok("ask requires session", askTs.includes("getValidSession"));
ok("ask caps memory facts", askTs.includes("IRIS_MAX_MEMORY_FACTS"));
ok("ask caps delegate report", askTs.includes("DELEGATE_MAX_REPORT_CHARS"));

ok("_iris re-exports safeFact", irisTs.includes('export { matchesForget, safeFact }'));
ok("_iris uses IRIS_MAX_HOPS", irisTs.includes("IRIS_MAX_HOPS"));
ok("_iris uses IRIS_MAX_CONTEXT_CHARS", irisTs.includes("IRIS_MAX_CONTEXT_CHARS"));
ok("_iris uses IRIS_MAX_TODO_TITLE_CHARS", irisTs.includes("IRIS_MAX_TODO_TITLE_CHARS"));
ok("_iris handles refusal", irisTs.includes('stop_reason === "refusal"'));

const specialistsTs = read("netlify/functions/_irisSpecialists.ts");
ok("specialists sanitize delegate task", specialistsTs.includes("sanitizeDelegateTask"));
ok("specialists enforce research min query", specialistsTs.includes("RESEARCH_MIN_QUERY_CHARS"));
ok("specialists enforce research daily cap", specialistsTs.includes("RESEARCH_DAILY_LIMIT"));

const researchHandler = read("netlify/functions/business-research.ts");
ok("business-research requires session", researchHandler.includes("getValidSession"));
ok("business-research imports shared limits", researchHandler.includes("RESEARCH_DAILY_LIMIT"));

ok("research memo re-exports daily limit", read("netlify/functions/_researchMemo.ts").includes("RESEARCH_DAILY_LIMIT"));

ok("weekly-audit GET requires session", read("netlify/functions/weekly-audit.ts").includes("getValidSession"));
ok("weekly-audit-scheduled uses shared cron", read("netlify/functions/weekly-audit-scheduled.ts").includes("WEEKLY_AUDIT_CRON"));

const passed = !process.exitCode;
console.log(passed ? `\nAgent guardrails audit passed (${checkCount} checks).` : `\nAgent guardrails audit failed (${checkCount} checks run).`);
