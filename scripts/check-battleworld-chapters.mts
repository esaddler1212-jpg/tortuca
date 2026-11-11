/** Battleworld chapter chain (Day 3) — progress wiring smoke. */
const mem = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, v);
  },
  removeItem: (k: string) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
};

import {
  BATTLEWORLD_CHAPTER_CHAIN_1_3,
  battleworldOpeningChapterChip,
  battleworldOpeningChapterObjective,
  syncBattleworldChapterChain1_3,
} from "../flight-nemulator/src/battleworld-chapters.ts";
import { hasArcBeat, recordArcBeat } from "../flight-nemulator/src/arc-progress.ts";

const hero = "solar-apex-test-" + Date.now();

let failed = false;
const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failed = true;
};

ok("chain has 3 chapters", BATTLEWORLD_CHAPTER_CHAIN_1_3.length === 3);

const fresh = syncBattleworldChapterChain1_3(hero, "hero", false);
ok("ch1 intro done", fresh[0]?.done === true);
ok("ch2 territory pending", fresh[1]?.done === false);
ok("ch2 is territory", fresh[1]?.step.id === "territory");

const chip0 = battleworldOpeningChapterChip(hero, "hero", false);
ok("chip shows open ch2", chip0.includes("2○"));

const objective0 = battleworldOpeningChapterObjective(hero, "hero", false);
ok("objective mentions Ch.2", objective0.includes("Ch.2"));

recordArcBeat(hero, "territory-clear");
const afterTerritory = syncBattleworldChapterChain1_3(hero, "hero", false);
ok("ch2 done after territory-clear", afterTerritory[1]?.done === true);
ok("ch3 stones pending", afterTerritory[2]?.done === false);

recordArcBeat(hero, "stone-linked");
const afterStones = syncBattleworldChapterChain1_3(hero, "hero", false);
ok("ch3 done after stone-linked", afterStones[2]?.done === true);

ok("opening complete message", battleworldOpeningChapterObjective(hero, "hero", false).includes("1–3 complete"));

// villain path: home-mark satisfies territory
const villain = "villain-test-" + Date.now();
ok("villain territory via home-mark", !hasArcBeat(villain, "home-mark"));
recordArcBeat(villain, "home-mark");
const vRows = syncBattleworldChapterChain1_3(villain, "villain", true);
ok("villain ch2 done", vRows[1]?.done === true);

if (failed) process.exitCode = 1;
else console.log("check-battleworld-chapters: ok");
