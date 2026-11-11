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
import { bayStreetRepPercent, regionRepPercent, streetRepRankFor } from "../drive-world/src/street-rep.ts";
import type { SavedProgress } from "../drive-world/src/game-progress.ts";
import { BOOST_FOV } from "../drive-world/src/nitro-zone-feel.ts";
import { BATTLEWORLD_CHAPTER_CHAIN_1_3 } from "../flight-nemulator/src/battleworld-chapters.ts";

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

const stub: SavedProgress = {
  version: 9,
  phase: "home",
  activeVehicleId: "starter-sedan",
  unlockedVehicleIds: [],
  visitedLandmarkIds: ["transamerica"],
  tacoTrucksFound: ["sf"],
  unlockedRegionIds: ["sf"],
  safehouseReached: true,
  customizations: {},
  lastPose: null,
  cameraMode: "chase",
  collectedIds: [],
  unlockedPaintIds: [],
  speedTrapBests: {},
  scenicCompleted: [],
  scenicProgress: {},
  vehicleStats: {},
  heatLevel: 0,
  heatPeakEver: 0,
  visitedVistaIds: [],
  journal: [],
  homeSafehouseId: "vallejo-safehouse",
  unlockedSafehouseIds: ["vallejo-safehouse"],
  customSafehouses: [],
  fuelLevel: 1,
  parkingStars: {},
  missionStepsCompleted: [],
  cpmDriftBests: {},
  cpmTimeAttackMs: {},
  cpmDragBestET: null,
  cpmGhostTapes: {},
  landmarkSprintMs: {},
  taxiCompletedIds: [],
  dynoRunCount: 0,
  meetBadges: [],
  activeTaxiId: null,
  tokyoLandmarkIds: [],
  tokyoFlights: 0,
  streetRepPeak: 0,
};
ok("street rep SF partial", regionRepPercent(stub, "sf") > 0 && regionRepPercent(stub, "sf") < 100);
ok("street rep rank", streetRepRankFor(bayStreetRepPercent(stub)).label.length > 2);

ok("lush nitro fov punch", BOOST_FOV.lush > BOOST_FOV.balanced);
ok(
  "battleworld chapters 1-3 chain",
  BATTLEWORLD_CHAPTER_CHAIN_1_3.join(",") === "intro,territory,stones"
);

if (failed) process.exitCode = 1;
