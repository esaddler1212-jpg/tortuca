/** MAYA Sentinel docs + helper — npm run test:maya-sentinel */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mayaCherryPickGuardForIris, mayaSentinelModeForRepo } from "../shared/mayaSentinelIrisBridge.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let n = 0;
const ok = (name: string, cond: boolean) => {
  n++;
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
};

ok("deep dive doc", fs.existsSync(path.join(root, "docs/DEEP_DIVE_MAYA_SENTINEL.md")));
ok("tools readme", fs.existsSync(path.join(root, "tools/maya-sentinel/README.md")));
ok("zip helper", fs.existsSync(path.join(root, "tools/maya-sentinel/zip-repo-for-scan.sh")));
ok("cherry pick index", fs.readFileSync(path.join(root, "docs/CHERRY_PICK_OPEN_SOURCE.md"), "utf8").includes("MAYA-Sentinel"));
ok("iris guard text", mayaCherryPickGuardForIris().includes("ai-surface"));
ok("mode map mcp", mayaSentinelModeForRepo("agent-mcp") === "ai-surface");
ok("App wires guard", fs.readFileSync(path.join(root, "src/App.tsx"), "utf8").includes("mayaCherryPickGuardForIris"));

console.log(`\nMAYA Sentinel checks passed (${n}).`);