#!/usr/bin/env node
/**
 * Print Godofprompt polish prompts (FABLE wizard + Vice '86 driving + Tortuca PlayCanvas).
 *
 * npm run game:polish-prompt -- city-nights fable-6
 * npm run game:polish-prompt -- city-nights vice86-5
 * npm run game:polish-prompt -- vice86 vice86-1
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const [, , game = "", step = "critique"] = process.argv;
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const stepKey = step.toLowerCase();
const viceTrack = stepKey.startsWith("vice86-");

const VICE86_ALIASES: Record<string, string> = {
  "vice86-1": "plan",
  "vice86-2": "city",
  "vice86-3": "garage",
  "vice86-4": "weather",
  "vice86-5": "sound",
  "vice86-6": "critique",
  "vice86-7": "screenshot-round",
};

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

const resolvedStep =
  VICE86_ALIASES[stepKey] ?? FABLE_ALIASES[stepKey] ?? stepKey;

const games = new Set(["city-nights", "battleworld", "wizard", "vice86"]);
const g = game.toLowerCase();
if (!games.has(g)) {
  console.error(
    "Usage: game-polish-prompt city-nights|battleworld|wizard|vice86 [fable-1..7|vice86-1..7|plan|city|garage|weather|sound|...]"
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

const VICE86_ORIGINAL: Record<string, string> = {
  plan: `You're a lead designer at a big game studio. Plan a 3D open-world driving game set in a neon 1986 Miami that runs in one HTML file. Give me: 4 areas of the city (beach strip, downtown, a bridge, the docks), 3 classic 80s sports cars, the colors as hex codes, the time of day and weather, the controls, the sounds, and the 5 details that will make players say "this looks like GTA."`,
  city: `Build the city in one HTML file with Three.js loaded from a CDN link. No 3D model files and no image files: every mesh, texture and light is made in code. Roads with lane lines, sidewalks, palm trees, pastel art deco hotels, a beach, a long bridge over water, and pink and blue neon signs. Sunset sky, light fog. I can drive a car with WASD and the camera follows from behind.`,
  garage: `Add a garage as the start screen: a dark room with pink neon lights, a glowing "Vice '86" sign and a car turning slowly on a round platform with a shiny floor. Let me switch between 3 cars made from shapes in code: a red wedge supercar, a black classic coupe and a white convertible. Then add driving feel: speed builds up, the car leans in turns, drifts a little and shoots flames on boost (Shift).`,
  weather: `Add a day-to-night cycle: sunset, then night with street lamps, neon glowing on the walls and car headlights. Add rain that starts and stops: falling drops, wet roads that reflect the lights, and drops on the screen when the camera faces forward. Add traffic: 20 simple cars driving in their lanes and stopping when I block them. Keep it smooth on a normal laptop and keep everything else the same.`,
  sound: `Add sound made with code, no sound files: an engine that gets higher as I speed up and drops when I brake, tires that squeal in drifts, rain and thunder, and an 80s synth radio that plays a simple looping beat. Add a "Start engine" button that starts all sound (browsers block sound before a click) and an R key to switch the radio on and off. Keep the rest the same.`,
  critique: `Here's a screenshot of my game: [upload]. Look at it like an art director at a big game studio. List the 5 things that look the most fake (light, colors, scale, empty spots, car shapes), worst first. Fix only those 5 and keep the rest the same. Then add a 30-second camera tour that flies over the city, drops behind the car and drives through the rain, so I can screen-record a trailer.`,
  "screenshot-round": `Screenshot the best moment and send it back. 2 or 3 rounds is where the wow comes from. After each round, re-run the art-director prompt on the same camera path you will use for the trailer.`,
};

if (g === "wizard") {
  const text = WIZARD_ORIGINAL[resolvedStep] ?? WIZARD_ORIGINAL.critique;
  console.log(`# Godofprompt FABLE (wizard) · step: ${resolvedStep}\n\n${text}\n`);
  console.log(`Tortuca: ${root}/docs/GAME_POLISH_FABLE_PROMPTS.md`);
  process.exit(0);
}

if (g === "vice86") {
  const text = VICE86_ORIGINAL[resolvedStep] ?? VICE86_ORIGINAL.critique;
  console.log(`# Godofprompt Vice '86 (driving) · step: ${resolvedStep}\n\n${text}\n`);
  console.log(`Tortuca City Nights: ${root}/docs/GAME_POLISH_VICE86_PROMPTS.md`);
  process.exit(0);
}

const pkg = g === "city-nights" ? "drive-world" : "flight-nemulator";
const name = g === "city-nights" ? "City Nights" : "Battleworld (Flight Nemulator)";

const viceCityNights: Record<string, string> = {
  plan: `Lead designer pass for Tortuca City Nights (PlayCanvas, ${pkg}/). Plan the Bay as a festival open world: 4 named regions + freeway spine, 3 vehicle fantasies from vehicle-catalog, HUD hex accents (existing CSS), weather via regional-weather.ts, controls + gamepad, procedural engine + playlist bed (no new licensed MP3s). List 5 details that sell "real driving game" for cn-d10. One slice scope — GAME_FINISH_PROGRAM.md.`,
  city: `Vice 2/7 — city read: street-name-registry, regional fog/exposure, hub streaming, storefront strips, landmarks. FREEWAY_DRONE_BUDGET. Chase/bumper cameras only. No Vice tileset in 3D; Bay research note stays HUD-only.`,
  garage: `Vice 3/7 — one garage/drive pass: estate garage cam, vehicle swap, nitro-zone-feel.ts, drift scoring, boost VFX. Three cars from unlock roster. Chromebook-safe lean/drift. No full garage UI rebuild in this message.`,
  weather: `Vice 4/7 — coastalWeatherEnabled, coastalRainAdjust, wet nitro grade, ambient + freeway drones (Chromebook cap 3). Night via exposure/fog. Rain on windshield only on Lush if added. test:playtest green.`,
  sound: `Vice 5/7 — game-audio.ts engine pitch, heat siren, drift beeps; Music panel + ACE playlist (cn-d09). Use existing tap-to-unlock; optional R → musicUsePlaylist. No radio rips.`,
  critique: `Here's a screenshot from City Nights (PlayCanvas, ${pkg}/): [attach PNG].

Art director (Vice 6/7): top 5 fakest reads (light, colors, scale, empty lots, car silhouette, HUD). Fix only those 5.

Trailer note: document a 30s record path (autopilot tour or vista → rainy freeway → nitro) for screen capture—no new cinematic engine unless cn-d10.

Then 3 next fixes for console browser feel.`,
  "screenshot-round": `Vice 7/7 — 2–3 rounds on nitro-at-dusk or wet freeway.

1. Signature moment (GAME_POLISH_LOOP.md)
2. npm run game:polish-prompt -- city-nights vice86-6
3. cd drive-world && npm run test:playtest
4. Same camera angle; repeat.`,
};

const fableBattleworld: Record<string, string> = {
  plan: `Plan hero-flight PlayCanvas (${pkg}/): chapter 1–3 HUD, wave-10 pair, home H on minimap. One bw-d0N slice.`,
  world: `District rims + sky-env.ts; nine districts distinct from orbit.`,
  "first-spell": `One juice pass: vfx.ts trails + wave-combat-juice.ts. List 3 weak points after.`,
  breakables: `Wave/destruction caps; trail maxLife.`,
  "more-spells": `One bw-d0N slice per PR.`,
  critique: `Screenshot critic (FABLE 6/7) for ${name}…`,
  "one-slice": `One GAME_FINISH_PROGRAM row for ${name}; game-finish:report.`,
  "screenshot-round": `2–3 rounds; test:flight-nemulator.`,
};

const fableCityNights: Record<string, string> = {
  plan: viceCityNights.plan,
  world: viceCityNights.city,
  "first-spell": viceCityNights.garage,
  breakables: viceCityNights.weather,
  "more-spells": `FABLE 5/7 — one cn-d0N slice per PR (playlist, photo, heat, etc.).`,
  critique: fableBattleworld.critique.replace("Battleworld", "City Nights") + `\n\nChase bob, nitro FOV, fade trails.`,
  "one-slice": `One cn-d0N row; game-finish:report.`,
  "screenshot-round": viceCityNights["screenshot-round"],
};

function pickPrompt(): string | undefined {
  if (g === "city-nights" && viceTrack) {
    return viceCityNights[resolvedStep];
  }
  if (g === "city-nights") {
    return fableCityNights[resolvedStep];
  }
  if (g === "battleworld") {
    const battle: Record<string, string> = {
      plan: fableBattleworld.plan!,
      world: fableBattleworld.world!,
      "first-spell": fableBattleworld["first-spell"]!,
      breakables: fableBattleworld.breakables!,
      "more-spells": fableBattleworld["more-spells"]!,
      critique: `Here's a screenshot from ${name} (PlayCanvas, ${pkg}/): [attach PNG].

Critic (FABLE 6/7): 5 fakest reads (colors, light, particles, camera, HUD). Fix only those 5.

Shake decay, trail fade (vfx.ts), arc chip clutter.`,
      "one-slice": fableBattleworld["one-slice"]!,
      "screenshot-round": fableBattleworld["screenshot-round"]!,
    };
    return battle[resolvedStep];
  }
  return undefined;
}

const text = pickPrompt();
if (!text) {
  console.error(`Unknown step "${step}" for ${g}. Try vice86-1..7, fable-1..7, or see docs.`);
  process.exit(1);
}

const carousel = viceTrack ? "Vice '86" : "FABLE";
console.log(`# ${name} · ${carousel} · step: ${resolvedStep}\n\n${text}\n`);

const original = viceTrack
  ? VICE86_ORIGINAL[resolvedStep]
  : WIZARD_ORIGINAL[resolvedStep];
if (original) {
  const label = viceTrack ? "Original Vice '86 prompt" : "Original FABLE wizard prompt";
  console.log(`---\n${label}:\n\n${original}\n`);
}

console.log(
  `Docs: ${root}/docs/GAME_POLISH_LOOP.md · ${root}/docs/GAME_POLISH_FABLE_PROMPTS.md · ${root}/docs/GAME_POLISH_VICE86_PROMPTS.md`
);

void readFileSync(path.join(root, "docs/GAME_POLISH_VICE86_PROMPTS.md"), "utf8");
void readFileSync(path.join(root, "docs/GAME_POLISH_FABLE_PROMPTS.md"), "utf8");