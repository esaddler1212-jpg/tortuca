import { existsSync, readFileSync } from "node:fs";

const paths = [
  "herald-os/CHERRY_PICK.md",
  "herald-os/README.md",
  "herald-os/bootstrap.sh",
  "shared/speechText.ts",
  "shared/voiceIntents.ts",
  "src/hooks/useGuardedAsync.ts",
];
let ok = true;
for (const p of paths) {
  if (!existsSync(p)) {
    console.error(`missing ${p}`);
    ok = false;
  }
}
const speech = readFileSync("shared/speechText.ts", "utf8");
if (!speech.includes("Herald OS")) {
  console.error("shared/speechText.ts missing Herald attribution");
  ok = false;
}
if (!process.exitCode && !ok) process.exitCode = 1;
console.log(ok ? "herald-cherry ok" : "herald-cherry failed");
