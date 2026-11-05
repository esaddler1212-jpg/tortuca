/** Quick HUD / Iris team integrity checks — run via npm run test:audit */
import { HUD_MODULE_IDS, HUD_MODULES, HUD_MORE, HUD_TABS } from "../shared/hudModules.ts";
import { IRIS_TEAM } from "../shared/irisTeam.ts";

const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
};

ok("11 HUD modules registered", HUD_MODULE_IDS.length === 11);
ok("module ids unique", new Set(HUD_MODULE_IDS).size === HUD_MODULE_IDS.length);
ok("tabs + more covers all modules", HUD_TABS.length + HUD_MORE.length === HUD_MODULE_IDS.length);
ok("team is in More not tabs", HUD_MORE.includes("team") && !HUD_TABS.includes("team"));

for (const m of HUD_MODULES) {
  ok(`module def: ${m.id} has label`, m.label.length > 0 && m.hint.length > 8);
}

for (const s of IRIS_TEAM) {
  ok(`specialist ${s.id} links valid module`, HUD_MODULE_IDS.includes(s.module));
}

console.log(process.exitCode ? "\nAudit failed." : "\nHUD audit passed.");
