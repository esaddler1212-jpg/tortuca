/** IRIS HUD / OS integrity — run via npm run test:audit */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HUD_MODULE_IDS, HUD_MODULES, HUD_MORE, HUD_TABS } from "../shared/hudModules.ts";
import { IRIS_SPECIALIST_IDS, IRIS_TEAM } from "../shared/irisTeam.ts";
import type { GaugeId } from "../shared/hudGauges.ts";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

const ok = (name: string, cond: boolean) => {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) process.exitCode = 1;
};

// ── Registry ───────────────────────────────────────────────────────────
ok("11 HUD modules registered", HUD_MODULE_IDS.length === 11);
ok("module ids unique", new Set(HUD_MODULE_IDS).size === HUD_MODULE_IDS.length);
ok("tabs + more covers all modules", HUD_TABS.length + HUD_MORE.length === HUD_MODULE_IDS.length);
ok("team is in More not tabs", HUD_MORE.includes("team") && !HUD_TABS.includes("team"));
ok("corner tabs match home gauges", HUD_TABS.every((id) => (["today", "vitals", "inbox", "plan"] as GaugeId[]).includes(id as GaugeId)));

for (const m of HUD_MODULES) {
  ok(`module def: ${m.id} has label`, m.label.length > 0 && m.hint.length > 8);
}

// ── Iris team ──────────────────────────────────────────────────────────
ok("six Iris specialists", IRIS_TEAM.length === 6 && IRIS_SPECIALIST_IDS.length === 6);
for (const s of IRIS_TEAM) {
  ok(`specialist ${s.id} links valid module`, HUD_MODULE_IDS.includes(s.module));
}

// ── App wiring ─────────────────────────────────────────────────────────
const appTs = read("src/App.tsx");
for (const id of HUD_MODULE_IDS) {
  ok(`App renderModule: ${id}`, new RegExp(`case "${id}"`).test(appTs));
}
ok("home stack has no CommandBar", !/CommandBar/.test(appTs));
ok("home has HudCore + UpNext", /HudCore/.test(appTs) && /UpNextPanel/.test(appTs));

// ── Pulse map (digital basemap, no raster CDN) ─────────────────────────
const pulseMap = read("src/components/PulseMap.tsx");
ok("PulseMap: digital basemap helper", /addDigitalBasemap/.test(pulseMap));
ok("PulseMap: no external tile CDN", !/cartocdn|tile\.openstreetmap|L\.tileLayer/.test(pulseMap));

// ── Iris brain tools ───────────────────────────────────────────────────
const irisTs = read("netlify/functions/_iris.ts");
ok("Iris: consult_specialist tool", /consult_specialist/.test(irisTs));
ok("Iris: open_module uses HUD_MODULE_IDS", /enum: HUD_MODULE_IDS/.test(irisTs));

// ── Dead home command UI removed ─────────────────────────────────────────
ok("CommandBar not imported in App", !appTs.includes('from "./components/CommandBar"'));

console.log(process.exitCode ? "\nOS audit failed." : "\nOS audit passed.");
