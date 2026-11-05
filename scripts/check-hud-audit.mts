/** IRIS HUD / OS integrity — run via npm run test:audit (extended pass) */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type Anthropic from "@anthropic-ai/sdk";
import {
  HUD_MODULE_IDS,
  HUD_MODULES,
  HUD_MORE,
  HUD_TABS,
  matchModuleFromSpeech,
  moduleContextForIris,
} from "../shared/hudModules.ts";
import {
  IRIS_SPECIALIST_IDS,
  IRIS_TEAM,
  specialistForModule,
  teamContextForIris,
  teamCoverageOk,
} from "../shared/irisTeam.ts";
import type { GaugeId } from "../shared/hudGauges.ts";
import {
  DUPLICATE_BLOCKED_PREFIX,
  duplicateBlockedMessage,
  findDuplicateDelegate,
  findOverlappingDelegate,
  mergeDelegateHistories,
  parseDelegateHistory,
  tasksSimilar,
  type IrisDelegateLog,
} from "../shared/irisTeamActivity.ts";
import { shopifyContextForIris, shopifyReadiness } from "../shared/shopify.ts";
import { stocksContext } from "../shared/irisContext.ts";
import { channelsSummary, normalizeChannels, pendingDrafts } from "../shared/channels.ts";
import { consultSpecialist, specialistEnumForTool } from "../netlify/functions/_irisSpecialists.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

let checkCount = 0;
const ok = (name: string, cond: boolean) => {
  checkCount++;
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
  return cond;
};

// ── Registry ───────────────────────────────────────────────────────────
ok("11 HUD modules registered", HUD_MODULE_IDS.length === 11);
ok("module ids unique", new Set(HUD_MODULE_IDS).size === HUD_MODULE_IDS.length);
ok("tabs + more covers all modules", HUD_TABS.length + HUD_MORE.length === HUD_MODULE_IDS.length);
ok("team is in More not tabs", HUD_MORE.includes("team") && !HUD_TABS.includes("team"));
ok("corner tabs match home gauges", HUD_TABS.every((id) => (["today", "vitals", "inbox", "plan"] as GaugeId[]).includes(id as GaugeId)));

for (const m of HUD_MODULES) {
  ok(`module def: ${m.id} has label`, m.label.length > 0 && m.hint.length > 8);
}

// ── Iris team roster ───────────────────────────────────────────────────
ok("one specialist per HUD module", teamCoverageOk());
ok("eleven Iris specialists", IRIS_TEAM.length === 11 && IRIS_SPECIALIST_IDS.length === 11);
for (const s of IRIS_TEAM) {
  ok(`specialist ${s.id} links valid module`, HUD_MODULE_IDS.includes(s.module));
  ok(`specialistForModule(${s.module})`, specialistForModule(s.module)?.id === s.id);
}
ok("woodhouse owns team module", IRIS_TEAM.find((s) => s.id === "woodhouse")?.module === "team");
ok("team prompt: duplicate guard", teamContextForIris().includes("DUPLICATE BLOCKED"));

const toolIds = specialistEnumForTool().slice().sort();
ok("consult_specialist enum matches roster", toolIds.join(",") === IRIS_SPECIALIST_IDS.slice().sort().join(","));
const specialistsTs = read("netlify/functions/_irisSpecialists.ts");
for (const id of IRIS_SPECIALIST_IDS) {
  ok(`consult handler: case ${id}`, new RegExp(`case "${id}"`).test(specialistsTs));
}

// ── Delegate / duplicate prevention (shared) ───────────────────────────
ok("tasksSimilar detects overlap", tasksSimilar("have scout research bay sponsors", "research bay area doc sponsors"));
ok("parseDelegateHistory drops junk", parseDelegateHistory([{ specialist: "scout", at: new Date().toISOString(), task: "x" }, { bad: 1 }]).length === 1);
ok("parseDelegateHistory rejects unknown id", parseDelegateHistory([{ specialist: "notreal", at: new Date().toISOString() }]).length === 0);

const hist: IrisDelegateLog[] = [
  {
    specialist: "navigator",
    at: new Date().toISOString(),
    task: "weekly handoffs and plan goals",
    report: "Plan context already pulled.",
  },
];
ok("findDuplicateDelegate hits same specialist", findDuplicateDelegate(hist, "navigator", "weekly plan handoffs") !== null);
ok(
  "findOverlappingDelegate blocks cross-specialist",
  findOverlappingDelegate(hist, "weekly handoffs and plan goals", "ledger")?.specialist === "navigator",
);
ok(
  "duplicateBlockedMessage prefix",
  duplicateBlockedMessage(hist[0], "America/Los_Angeles").startsWith(DUPLICATE_BLOCKED_PREFIX),
);
ok(
  "mergeDelegateHistories keeps newest report",
  mergeDelegateHistories(
    [{ specialist: "scribe", at: "2026-11-01T12:00:00Z", task: "draft", report: "short" }],
    [{ specialist: "scribe", at: "2026-11-01T12:00:00Z", task: "draft", report: "longer report" }],
  )[0]?.report === "longer report",
);

ok("shopify context when unconfigured", shopifyContextForIris({ configured: false, products: [], openOrders: [] }).includes("not connected"));
ok("shopify readiness lists gaps", shopifyReadiness({ configured: false, products: [], openOrders: [] }).ready === false);

// ── App wiring ─────────────────────────────────────────────────────────
const appTs = read("src/App.tsx");
for (const id of HUD_MODULE_IDS) {
  ok(`App renderModule: ${id}`, new RegExp(`case "${id}"`).test(appTs));
}
ok("home stack has no CommandBar", !/CommandBar/.test(appTs));
ok("home has HudCore + UpNext", /HudCore/.test(appTs) && /UpNextPanel/.test(appTs));
ok("ask context includes teamOpsContextForAsk", appTs.includes("teamOpsContextForAsk()"));
ok("ask context includes shopify", appTs.includes("shopifyContextForIris"));
ok("Apps module: Easy Supply Shopify panel", appTs.includes("EasySupplyStorePanel"));
ok("Hub Money tab shows market update", read("src/components/HubPanel.tsx").includes("MoneyMarketUpdate"));
ok("user-data merges irisDelegateHistory", read("netlify/functions/user-data.ts").includes("mergeDelegateHistories"));
ok("Scribe creates drafts server-side", read("netlify/functions/_irisSpecialists.ts").includes("createScribeDraft"));
ok("shopify-store function exists", fs.existsSync(path.join(root, "netlify/functions/shopify-store.ts")));

const convoTs = read("src/hooks/useConversation.ts");
ok("client sends delegateHistory on ask", convoTs.includes("delegateHistory: readDelegateHistory()"));
ok("client stores report when not deduped", convoTs.includes("report: delegateReport"));

const askTs = read("netlify/functions/ask.ts");
ok("ask parses delegateHistory", askTs.includes("parseDelegateHistory"));
ok("ask returns delegateReport and deduped", askTs.includes("delegateReport") && askTs.includes("deduped"));

// ── Pulse map (digital basemap) ─────────────────────────────────────────
const pulseMap = read("src/components/PulseMap.tsx");
ok("PulseMap: digital basemap helper", /addDigitalBasemap/.test(pulseMap));
ok("PulseMap: no external tile CDN", !/cartocdn|tile\.openstreetmap|L\.tileLayer/.test(pulseMap));
ok("Vitals opens Pulse on Map", /defaultOpen/.test(appTs) && appTs.includes('case "vitals"'));

// ── Iris brain tools ───────────────────────────────────────────────────
const irisTs = read("netlify/functions/_iris.ts");
ok("Iris: consult_specialist tool", /consult_specialist/.test(irisTs));
ok("Iris: open_module uses HUD_MODULE_IDS", /enum: HUD_MODULE_IDS/.test(irisTs));
ok("Iris: delegate dedupe in runIris", irisTs.includes("delegateDeduped") && irisTs.includes("deduped"));

ok("CommandBar not imported in App", !appTs.includes('from "./components/CommandBar"'));

// ── Server consult duplicate block (no API) ────────────────────────────
const noopClient = {} as Anthropic;
const blocked = await consultSpecialist(noopClient, {
  specialist: "courier",
  task: "summarize unread mail",
  context: "",
  sessionId: "audit",
  who: "audit@test",
  timeZone: "America/Los_Angeles",
  delegateHistory: [
    {
      specialist: "courier",
      at: new Date().toISOString(),
      task: "summarize my unread mail",
      report: "Three unread, two need reply.",
    },
  ],
});
ok("consultSpecialist blocks duplicate courier", blocked.deduped === true && blocked.summary.includes("DUPLICATE BLOCKED"));

// ── Extended pass: commerce, markets, channels, APIs ────────────────────
ok("stocksContext mentions watchlist", stocksContext({
  watchlist: [{ symbol: "NVDA", changePercent: 1, theme: "ai" }],
  upcomingIpos: [],
}).includes("NVDA"));
ok("stocksContext empty when no data", stocksContext(null) === "");
ok("ask context includes stocksContext", appTs.includes("stocksContext(stocks)"));
ok("sync hydrates delegate history", read("src/hooks/useUserDataSync.ts").includes("hydrateDelegateHistoryFromAccount"));
ok("ask merges account delegate history", askTs.includes("mergeDelegateHistories"));
ok("ask persists irisDelegateHistory", askTs.includes("irisDelegateHistory"));
ok("Team panel: recent activity", read("src/components/hud/TeamPanel.tsx").includes("Recent activity"));
ok("Team panel: Ask Iris", read("src/components/hud/TeamPanel.tsx").includes("Ask Iris"));
ok("Scribe draft: easy-supply channel", read("netlify/functions/_scribeDraft.ts").includes("easy-supply"));
ok("Wire specialist: shopify context", /shopify|easy supply/i.test(specialistsTs));
ok("stocks API handler exists", fs.existsSync(path.join(root, "netlify/functions/stocks.ts")));
ok("channel-send handler exists", fs.existsSync(path.join(root, "netlify/functions/channel-send.ts")));
ok("business-research handler exists", fs.existsSync(path.join(root, "netlify/functions/business-research.ts")));
ok("netlify.toml: ask timeout 26s", read("netlify.toml").includes('[functions."ask"]') && read("netlify.toml").includes("timeout = 26"));
ok("api redirect to functions", read("netlify.toml").includes('from = "/api/*"'));
ok("speech routes team module", matchModuleFromSpeech("open the team") === "team");
ok("speech routes hub for memos", matchModuleFromSpeech("show hub memos") === "hub");
ok("moduleContextForIris lists all modules", HUD_MODULE_IDS.every((id) => moduleContextForIris().includes(`${id}:`)));
const ch = normalizeChannels(null, "e@ecs.network");
ok("channels: easy-supply can send", ch.channels.find((c) => c.id === "easy-supply")?.canSend === true);
const withDraft = {
  ...ch,
  drafts: [{ id: "d1", channelId: "easy-supply" as const, to: "", subject: "x", body: "y", status: "pending" as const, createdAt: new Date().toISOString() }],
};
ok("channelsSummary counts pending drafts", channelsSummary(withDraft)?.includes("Easy Supply") === true);
ok("pendingDrafts filters pending only", pendingDrafts(withDraft).length === 1);
ok("shopify-store requires session", read("netlify/functions/shopify-store.ts").includes("getValidSession"));
ok("ask requires session", askTs.includes("getValidSession") || askTs.includes("getValidSession(sessionId)"));
ok("useStocks hits /api/stocks", read("src/hooks/useStocks.ts").includes('"/api/stocks"'));
ok("Morning brief can use stocks", read("src/lib/stocksBriefing.ts").includes("stocksBriefingLines"));
ok("Hub passes stocks props", appTs.includes("stocks={stocks}"));
ok("AGENTS.md guardrails doc", fs.existsSync(path.join(root, "AGENTS.md")));
ok("shared agentGuardrails module", fs.existsSync(path.join(root, "shared/agentGuardrails.ts")));
ok("Iris team prompt includes guardrails", read("shared/irisTeam.ts").includes("agentGuardrailsPrompt"));

for (const id of ["today", "inbox", "plan", "hub", "meal", "research", "channels"] as const) {
  ok(`lazy prefetch: ${id}`, read("src/lazyModules.tsx").includes(`${id}:`));
}

const passed = !process.exitCode;
console.log(passed ? `\nOS audit passed (${checkCount} checks).` : `\nOS audit failed (${checkCount} checks run).`);
