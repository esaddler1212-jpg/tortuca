import {
  combatJuicePhase,
  waveCombatHudChip,
} from "../flight-nemulator/src/wave-combat-juice.ts";
import { PAIR_BOSS_WAVE } from "../flight-nemulator/src/hero-pair-boss.ts";

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failed = true;
};

ok("wave 3 calm", combatJuicePhase(3, false, false) === "calm");
ok("wave 8 rising", combatJuicePhase(8, false, false) === "rising");
ok("wave 10 finale", combatJuicePhase(10, false, false) === "finale");
ok("pair duel", combatJuicePhase(10, true, false) === "pair-duel");
ok(
  "finale chip",
  waveCombatHudChip("finale", PAIR_BOSS_WAVE)?.includes("FINALE") === true
);
ok(
  "pair chip",
  waveCombatHudChip("pair-duel", PAIR_BOSS_WAVE)?.includes("PAIR DUEL") === true
);

if (failed) process.exitCode = 1;
else console.log("check-wave-combat-juice: ok");
