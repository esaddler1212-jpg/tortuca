/** Revenue OS wiring — npm run test:revenue-os */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  REVENUE_TARGETS,
  revenueMonthBreakdown,
  shopLaunchProgress,
  revenueContextForIris,
} from "../shared/revenueOs.ts";
import { REVENUE_SCOUT_PRESET } from "../shared/revenueOs.ts";
import { REVENUE_ACTIVATION_PREP, REVENUE_ACTIVATION_GO_LIVE, activationPlanForDate } from "../shared/revenueActivationPlan.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

let n = 0;
const ok = (name: string, cond: boolean) => {
  n++;
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
};

ok("short target 2000", REVENUE_TARGETS.shortMonthly === 2_000);
ok("long target 10000", REVENUE_TARGETS.longMonthly === 10_000);
ok("60/40 split", REVENUE_TARGETS.shopShare === 0.6 && REVENUE_TARGETS.serviceShare === 0.4);

const b = revenueMonthBreakdown(
  [
    { id: "1", date: "2026-11-01", kind: "in", amount: 400, category: "Easy Supply" },
    { id: "2", date: "2026-11-12", kind: "in", amount: 250, category: "Thumbnails" },
  ],
  "2026-11",
);
ok("MTD split", b.shop === 400 && b.service === 250 && b.total === 650);
ok("shop target 1200", b.shopTarget === 1_200);
ok("service target 800", b.serviceTarget === 800);

ok("launch progress", shopLaunchProgress({ photos: true, hero_sku: true }).done === 2);
ok("iris context mentions bootstrap", revenueContextForIris([], "2026-11", undefined, null).includes("bootstrap"));

ok("docs exist", fs.existsSync(path.join(root, "docs/REVENUE_OS.md")));
ok("RevenueOsPanel in Hub", read("src/components/HubPanel.tsx").includes("RevenueOsPanel"));
ok("scout preset in research", read("shared/businessResearch.ts").includes("REVENUE_SCOUT_PRESET"));
ok("Thumbnails income category", read("shared/hub.ts").includes('"Thumbnails"'));
ok("thumbnail preset query", REVENUE_SCOUT_PRESET.query.length > 40);
ok("activation prep 36 days", REVENUE_ACTIVATION_PREP.length === 36);
ok("go-live plan", activationPlanForDate(REVENUE_ACTIVATION_GO_LIVE)?.theme.includes("ACTIVATE") ?? false);
ok("activation doc", fs.existsSync(path.join(root, "docs/REVENUE_OS_JAN2027_ACTIVATION.md")));

console.log(`\nRevenue OS checks passed (${n}).`);