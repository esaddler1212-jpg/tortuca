/** Dust Orb bridge — npm run test:dust-orb-bridge */
import { mapIrisToDustOrb } from "../shared/dustOrbBridge.ts";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let n = 0;
const ok = (name: string, cond: boolean) => {
  n++;
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
};

ok("deep dive", fs.existsSync(path.join(root, "docs/DEEP_DIVE_DUST_ORB.md")));
ok("vendor dust-orb.js", fs.existsSync(path.join(root, "public/vendor/dust-orb/dust-orb.js")));
ok("CoreRing dust host", fs.readFileSync(path.join(root, "src/components/hud/CoreRing.tsx"), "utf8").includes("DustOrbHost"));
ok("wide hook", fs.existsSync(path.join(root, "src/hooks/useWideCoreViewport.ts")));
ok("thinking", mapIrisToDustOrb({ phase: "thinking", speaking: false }).state === "thinking");
ok("speaking", mapIrisToDustOrb({ phase: "speaking", speaking: true }).state === "speaking");
ok("agitated", mapIrisToDustOrb({ phase: "idle", speaking: false, askError: true }).state === "agitated");

console.log(`\nDust Orb bridge checks passed (${n}).`);