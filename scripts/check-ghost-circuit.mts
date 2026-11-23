import {
  GHOST_SPRINT_CIRCUIT,
  ghostCircuitMapLines,
  ghostCircuitRosterLabel,
} from "../drive-world/src/sprint-circuit-roster.ts";
import type { SavedProgress } from "../drive-world/src/game-progress.ts";

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failed = true;
};

ok("ghost circuit has 3 routes", GHOST_SPRINT_CIRCUIT.length === 3);
ok("all ghost routes have tape", GHOST_SPRINT_CIRCUIT.every((s) => s.ghostTape));

const stub = { landmarkSprintMs: { "freeway-i80-east": 45000 } } as SavedProgress;
const lines = ghostCircuitMapLines(stub);
ok("map lines count", lines.length === 3);
ok("map line coords", lines[0]!.x1 !== lines[0]!.x2);
ok("roster label", ghostCircuitRosterLabel(stub).includes("1:45.0"));

if (failed) process.exitCode = 1;
else console.log("check-ghost-circuit: ok");
