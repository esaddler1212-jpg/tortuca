/** Game finish program — slices, status file, Iris line. Run: npm run test:game-finish */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GAME_FINISH_SLICES,
  GAME_STUDIO_AGENTS,
  gameFinishContextForAsk,
  type GameFinishStatusFile,
} from "../shared/gameFinishProgram.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const statusPath = path.join(root, "shared/game-finish-status.json");

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failed = true;
};

ok("two game-studio agents", GAME_STUDIO_AGENTS.length === 2);
ok("20 slices (10 per game)", GAME_FINISH_SLICES.length === 20);

const status = JSON.parse(fs.readFileSync(statusPath, "utf8")) as GameFinishStatusFile;
for (const s of GAME_FINISH_SLICES) {
  ok(`status has ${s.id}`, Boolean(status.sliceState[s.id]));
}
for (const r of status.reports) {
  ok(`report slice ${r.sliceId}`, GAME_FINISH_SLICES.some((x) => x.id === r.sliceId));
}

const iris = gameFinishContextForAsk(status);
ok("Iris line mentions Nightshift", iris.includes("Nightshift"));
ok("Iris line mentions Skyring", iris.includes("Skyring"));
ok("Iris line under length", iris.length < 1200);

if (failed) process.exitCode = 1;
