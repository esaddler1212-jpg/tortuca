#!/usr/bin/env node
/**
 * Print Godofprompt FABLE-style polish prompts (original wizard + Tortuca PlayCanvas).
 *
 * npm run game:polish-prompt -- city-nights fable-6
 * npm run game:polish-prompt -- wizard fable-1
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const [, , game = "", step = "critique"] = process.argv;
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const FABLE_ALIASES: Record<string, string> = {
  "fable-1": "plan",
  "fable-2": "world",
  "fable-3": "first-spell",
  "fable-4": "breakables",
  "fable-5": "more-spells",
  "fable-6": "critique",
  "fable-7": "screenshot-round",
  "fix-real": "critique",
};

const resolvedStep = FABLE_ALIASES[step.toLowerCase()] ?? step.toLowerCase();

const games = new Set(["city-nights", "battleworld", "wizard"]);
const g = game.toLowerCase();
if (!games.has(g)) {
  console.error(
    "Usage: game-polish-prompt city-nights|battleworld|wizard [plan|world|first-spell|breakables|more-spells|critique|screenshot-round|fable-1..7|one-slice]"
  );
  process.exit(1);
}

const WIZARD_ORIGINAL: Record<string, string> = {
  plan: `You're a game designer. Plan a small first-person wizard game I'll build in the browser with Three.js. Give me: the world (a meadow with flowers, a stone tower, a cottage, a windmill, old ruins, trees), 7 spells with what each one does and its color, how the player moves and aims, and the one moment people will want to record. Keep it small enough to build in a day: one map, no enemies, no menus, just playing with magic.`,
  world: `Build the world in one HTML file with Three.js loaded from a CDN link. No 3D model files and no image files: every mesh, texture and light is made in code. A bright meadow with tall grass that sways, blue and pink flowers, round trees, a stone tower, a cottage with a red roof and a windmill. Soft sun, long shadows, light fog in the distance. Walk with WASD and look around by dragging the mouse, with a wooden staff in the player's hand.`,
  "first-spell": `Add a fire spell. When I click, a glowing rune circle appears where I aim, then a big explosion with flames, smoke, sparks and flying debris. The grass around it burns and turns black. Add a small screen shake and a bright flash. Make the sound with code, no sound files. Keep the world exactly as it is. Then tell me the 3 things that still feel weak and how you would fix them.`,
  breakables: `Rebuild the tower, the cottage and the ruins from separate stone blocks and wooden planks, about 1,500 pieces in total. Write simple physics in code so pieces fall, roll and pile up when a spell hits them. The fire explosion should blow the tower apart. Keep it smooth on a normal laptop: let pieces rest once they stop moving and cap how many move at once. Keep everything else exactly the same.`,
  "more-spells": `Add 6 more spells, each with its own color and rune circle: a purple black hole that pulls pieces in and crushes them, a fire tornado that lifts debris, frost that freezes the grass, lightning, a mind blast, and a growth spell that grows flowers and a full tree. Add a spell bar at the top with an icon drawn in code for each one, and number keys 1 to 7 to switch. Keep everything already built the same.`,
  critique: `Here's a screenshot from my game: [upload]. Look at it like a game critic. List the 5 things that look or feel the most fake (colors, light, particles, physics, camera), worst first. Fix only those 5 and keep the rest the same. Add a little camera bob when walking, a staff swing when casting and particles that fade out slowly. Then tell me what you would fix next to make it look like a real game.`,
  "screenshot-round": `Screenshot the best moment and send it back. 2 or 3 rounds is where the wow comes from.

Workflow:
1. Capture your best frame.
2. Run critique prompt on the screenshot.
3. Apply fixes only; keep the world the same.
4. Re-capture the same angle. Repeat 2–3 times.`,
};

if (g === "wizard") {
  const text = WIZARD_ORIGINAL[resolvedStep] ?? WIZARD_ORIGINAL.critique;
  console.log(`# Godofprompt FABLE (original wizard) · step: ${resolvedStep}\n\n${text}\n`);
  console.log(`Tortuca mapping: ${root}/docs/GAME_POLISH_FABLE_PROMPTS.md`);
  process.exit(0);
}

const pkg = g === "city-nights" ? "drive-world" : "flight-nemulator";
const name = g === "city-nights" ? "City Nights" : "Battleworld (Flight Nemulator)";

const prompts: Record<string, string> = {
  plan:
    g === "city-nights"
      ? `You're a game designer. Plan a small browser driving game in PlayCanvas (Tortuca City Nights, ${pkg}/).\nOne map (Bay Area), no new menus.\nDeliver: the 15-minute funnel (spawn → freeway → one collectible), 3 HUD wins (street rep, minimap leg, nitro read), heat-trap loop, and the one screenshot moment players will share. Keep scope to one finish slice (cn-d0N). See docs/GAME_FINISH_PROGRAM.md.`
      : `You're a game designer. Plan a small browser hero-flight game in PlayCanvas (${pkg}/).\nOne Earth districts layer, chapter chain 1–3 visible on HUD.\nDeliver: orbit read, wave-10 pair moment, home H on minimap, arc/lattice chips, and the one screenshot moment. Keep scope to one finish slice (bw-d0N). See docs/GAME_FINISH_PROGRAM.md.`,
  world:
    g === "city-nights"
      ? `Polish the Bay world read in ${pkg}: coastal fog/exposure (src/regional-weather.ts), district labels, freeway drones within FREEWAY_DRONE_BUDGET / Chromebook cap. No new raster map in the 3D sim. Keep save format. (FABLE 2/7: procedural world, all in code.)`
      : `Polish district universe rims and sky in ${pkg}/src/battleworld-districts.ts + sky-env.ts. Nine districts must read distinct from orbit. No new GLB pipeline in this message. (FABLE 2/7.)`,
  "first-spell":
    g === "city-nights"
      ? `One juice pass only (FABLE 3/7): nitro zone FOV + canvas grade OR ghost sprint PB toast—not both. Files: nitro-zone-feel.ts, game-loop.ts. Screen shake + procedural audio only (game-audio.ts). Particles/grades must ease in and fade out. Keep the world the same. List 3 weak points after.`
      : `One juice pass only (FABLE 3/7): primary boost trail + screen shake on heavy hits. Files: vfx.ts, wave-combat-juice.ts. Trails must fade out slowly (opacity/scale). Keep roster and chapters unchanged. List 3 weak points after.`,
  breakables:
    g === "city-nights"
      ? `FABLE 4/7 — perf as "breakables": FREEWAY_DRONE_BUDGET, hub streaming cadence, Chromebook preset. Any new debris: cap active movers, sleep when at rest. Heat chaser is pursuit physics—keep smooth. test:playtest green.`
      : `FABLE 4/7: destruction and wave spawns stay capped per tick. Debris via vfx trails with maxLife + fade; no uncapped rigidbody piles. test:flight-nemulator green.`,
  "more-spells":
    g === "city-nights"
      ? `FABLE 5/7 — one feature per message (not 6 spells at once). Implement exactly one cn-d0N row from docs/GAME_FINISH_PROGRAM.md. Examples: playlist ACE bed, photo orbit, heat chase. One commit, verify row, game-finish:report. HUD chips must not overlap awkwardly.`
      : `FABLE 5/7 — one feature per message. Implement exactly one bw-d0N row. Examples: chapter dialogue, minimap H, offline save copy. One commit, verify, game-finish:report.`,
  critique: `Here's a screenshot from ${name} (PlayCanvas, ${pkg}/): [attach PNG].

Act like a game critic (FABLE 6/7). List the 5 things that look or feel most fake (colors, light, particles, physics, camera, HUD), worst first.

Fix only those 5 in TypeScript. Keep everything else the same.

Apply when relevant:
${
  g === "city-nights"
    ? "- Chase camera bob at cruise speed (chase-camera-bob.ts)\n- Nitro FOV punch and heat HUD readability\n- Particles/trails that fade out slowly"
    : "- Combat shake decay\n- Boost trails fade slowly (vfx.ts)\n- District rim/sky + arc objective chip clutter"
}

Then name the 3 things you'd fix next for console-quality browser feel.`,
  "one-slice": `Implement exactly one row from docs/GAME_FINISH_PROGRAM.md for ${name}. One feature, one commit message, verify row passes, then game-finish:report.`,
  "screenshot-round": `FABLE 7/7 — 2 or 3 rounds is where the wow comes from.

Round workflow for ${name}:
1. Capture signature moment (docs/GAME_POLISH_LOOP.md table).
2. Run: npm run game:polish-prompt -- ${g} critique
3. Apply fixes + ${g === "city-nights" ? "cd drive-world && npm run test:playtest" : "npm run test:flight-nemulator"}
4. Re-screenshot the same camera angle. Repeat.`,
};

const text = prompts[resolvedStep];
if (!text) {
  console.error(`Unknown step "${step}". Try fable-1..fable-7 or plan|world|first-spell|breakables|more-spells|critique|screenshot-round|one-slice.`);
  console.error(`Full catalog: docs/GAME_POLISH_FABLE_PROMPTS.md`);
  process.exit(1);
}

const original = WIZARD_ORIGINAL[resolvedStep];
console.log(`# ${name} · polish step: ${resolvedStep} (FABLE carousel)\n\n${text}\n`);
if (original) {
  console.log(`---\nOriginal wizard prompt (Three.js reference):\n\n${original}\n`);
}
console.log(`Docs: ${root}/docs/GAME_POLISH_LOOP.md · ${root}/docs/GAME_POLISH_FABLE_PROMPTS.md`);

// Smoke: doc exists when CI runs test:game-finish
void readFileSync(path.join(root, "docs/GAME_POLISH_FABLE_PROMPTS.md"), "utf8");