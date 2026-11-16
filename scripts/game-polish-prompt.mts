#!/usr/bin/env node
/**
 * Print Tortuca-adapted polish-loop prompts (godofprompt-style, PlayCanvas).
 *
 * npm run game:polish-prompt -- city-nights critique
 */
import { fileURLToPath } from "node:url";
import path from "node:path";

const [, , game = "", step = "critique"] = process.argv;
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const games = new Set(["city-nights", "battleworld"]);
const g = game.toLowerCase();
if (!games.has(g)) {
  console.error("Usage: game-polish-prompt city-nights|battleworld [plan|world|first-spell|breakables|one-slice|critique|screenshot-round]");
  process.exit(1);
}

const pkg = g === "city-nights" ? "drive-world" : "flight-nemulator";
const name = g === "city-nights" ? "City Nights" : "Battleworld (Flight Nemulator)";

const prompts: Record<string, string> = {
  plan:
    g === "city-nights"
      ? `You're a game designer. Plan a small browser driving game in PlayCanvas (Tortuca City Nights, ${pkg}/).\nOne map (Bay Area), no new menus.\nDeliver: the 15-minute funnel (spawn → freeway → one collectible), 3 HUD wins (street rep, minimap leg, nitro read), and the one screenshot moment players will share. Keep scope to one finish slice (cn-d0N).`
      : `You're a game designer. Plan a small browser hero-flight game in PlayCanvas (${pkg}/).\nOne Earth districts layer, chapter chain 1–3 visible on HUD.\nDeliver: orbit read, wave-10 pair moment, offline save clarity on VantageGames, and the one screenshot moment. Keep scope to one finish slice (bw-d0N).`,
  world:
    g === "city-nights"
      ? `Polish the Bay world read in ${root}/${pkg}: coastal fog/exposure (${pkg}/src/regional-weather.ts), district labels, freeway drones within Chromebook budget. No new raster map in the 3D sim. Keep save format.`
      : `Polish district universe rims and sky in ${pkg}/src/battleworld-districts.ts + theme. Nine districts must read distinct from orbit. No new GLB pipeline in this message.`,
  "first-spell":
    g === "city-nights"
      ? `One juice pass only: nitro zone FOV + canvas grade OR ghost sprint PB toast—not both. Files: nitro-zone-feel.ts, game-loop. Add particles/FOV that fade smoothly. Keep the world the same. List 3 weak points after.`
      : `One juice pass only: primary boost trail + screen shake on heavy hits. Files: vfx.ts, wave-combat-juice.ts. Trails must fade out slowly (opacity/scale). Keep roster and chapters unchanged. List 3 weak points after.`,
  breakables:
    g === "city-nights"
      ? `Respect perf caps: FREEWAY_DRONE_BUDGET, hub streaming cadence, Chromebook preset. If adding breakables/props, cap active movers and sleep when at rest. Keep test:playtest green.`
      : `Destruction and wave spawns stay capped per tick. If adding debris, reuse vfx trails with maxLife + sleep; no uncapped rigidbody piles. Keep test:flight-nemulator green.`,
  "one-slice":
    `Implement exactly one row from docs/GAME_FINISH_PROGRAM.md for ${name}. One feature, one commit message, verify row passes, then game-finish:report.`,
  critique: `Here's a screenshot from ${name} (PlayCanvas, ${pkg}/): [attach PNG].

Act like a game critic. List the 5 things that look or feel most fake (colors, light, particles, physics, camera, HUD), worst first.

Fix only those 5 in TypeScript. Keep everything else the same.

Then name the 3 things you'd fix next for console-quality browser feel.`,
  "screenshot-round": `Round workflow for ${name}:
1. Capture signature moment (see docs/GAME_POLISH_LOOP.md).
2. Run: npm run game:polish-prompt -- ${g} critique
3. Apply fixes + ${g === "city-nights" ? "cd drive-world && npm run test:playtest" : "npm run test:flight-nemulator"}
4. Re-screenshot same camera angle. Repeat 2–3 rounds.`,
};

const text = prompts[step] ?? prompts.critique;
console.log(`# ${name} · polish step: ${step}\n\n${text}\n`);
console.log(`Doc: ${root}/docs/GAME_POLISH_LOOP.md`);