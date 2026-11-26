/** Sure bridge wiring — npm run test:sure-integration */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sureSetupHintForIris, sureSummaryLine } from "../shared/sureIrisBridge.ts";
import { SESSION_REQUIRED_HANDLERS } from "../shared/thinProgrammingPolicy.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

let n = 0;
const ok = (name: string, cond: boolean) => {
  n++;
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
};

ok("sure-summary handler exists", fs.existsSync(path.join(root, "netlify/functions/sure-summary.ts")));
ok("handler session gate", read("netlify/functions/sure-summary.ts").includes("getValidSession"));
ok("policy lists sure-summary", SESSION_REQUIRED_HANDLERS.includes("sure-summary"));
ok("deep dive doc", fs.existsSync(path.join(root, "docs/DEEP_DIVE_SURE_ASTRYX.md")));
ok("App wires sure context", read("src/App.tsx").includes("sureContextForIris"));
ok("iris hint non-empty", sureSetupHintForIris().length > 80);
ok(
  "summary line formats",
  sureSummaryLine({
    configured: true,
    dataSource: "sure",
    accountCount: 2,
    assetsTotal: 1500,
  }).includes("account") && sureSummaryLine({ configured: true, dataSource: "sure", assetsTotal: 1500 }).includes("1,500"),
);

console.log(`\nSure integration checks passed (${n}).`);