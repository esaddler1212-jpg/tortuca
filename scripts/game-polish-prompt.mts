#!/usr/bin/env node
/**
 * Godofprompt Vice '86 polish prompts + Tortuca PlayCanvas mapping.
 *
 * npm run game:polish-prompt -- vice86 vice86-6
 * npm run game:polish-prompt -- city-nights vice86-3
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const [, , game = "", step = "critique"] = process.argv;
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const stepKey = step.toLowerCase();

const STEP_ALIASES: Record<string, string> = {
  "vice86-1": "plan",
  "vice86-2": "city",
  "vice86-3": "garage",
  "vice86-4": "weather",
  "vice86-5": "sound",
  "vice86-6": "critique",
  "vice86-7": "screenshot-round",
  world: "city",
  "first-spell": "garage",
  breakables: "weather",
  "more-spells": "sound",
  "fix-real": "critique",
};

const resolvedStep = STEP_ALIASES[stepKey] ?? stepKey;

const games = new Set(["city-nights", "battleworld", "vice86"]);
const g = game.toLowerCase();
if (!games.has(g)) {
  console.error(
    "Usage: game-polish-prompt city-nights|battleworld|vice86 [vice86-1..7|plan|city|garage|weather|sound|critique|screenshot-round|one-slice]"
  );
  process.exit(1);
}

const VICE86_ORIGINAL: Record<string, string> = {
  plan: `You're a lead designer at a big game studio. Plan a 3D open-world driving game set in a neon 1986 Miami that runs in one HTML file. Give me: 4 areas of the city (beach strip, downtown, a bridge, the docks), 3 classic 80s sports cars, the colors as hex codes, the time of day and weather, the controls, the sounds, and the 5 details that will make players say "this looks like GTA."`,
  city: `Build the city in one HTML file with Three.js loaded from a CDN link. No 3D model files and no image files: every mesh, texture and light is made in code. Roads with lane lines, sidewalks, palm trees, pastel art deco hotels, a beach, a long bridge over water, and pink and blue neon signs. Sunset sky, light fog. I can drive a car with WASD and the camera follows from behind.`,
  garage: `Add a garage as the start screen: a dark room with pink neon lights, a glowing "Vice '86" sign and a car turning slowly on a round platform with a shiny floor. Let me switch between 3 cars made from shapes in code: a red wedge supercar, a black classic coupe and a white convertible. Then add driving feel: speed builds up, the car leans in turns, drifts a little and shoots flames on boost (Shift).`,
  weather: `Add a day-to-night cycle: sunset, then night with street lamps, neon glowing on the walls and car headlights. Add rain that starts and stops: falling drops, wet roads that reflect the lights, and drops on the screen when the camera faces forward. Add traffic: 20 simple cars driving in their lanes and stopping when I block them. Keep it smooth on a normal laptop and keep everything else the same.`,
  sound: `Add sound made with code, no sound files: an engine that gets higher as I speed up and drops when I brake, tires that squeal in drifts, rain and thunder, and an 80s synth radio that plays a simple looping beat. Add a "Start engine" button that starts all sound (browsers block sound before a click) and an R key to switch the radio on and off. Keep the rest the same.`,
  critique: `Here's a screenshot of my game: [upload]. Look at it like an art director at a big game studio. List the 5 things that look the most fake (light, colors, scale, empty spots, car shapes), worst first. Fix only those 5 and keep the rest the same. Then add a 30-second camera tour that flies over the city, drops behind the car and drives through the rain, so I can screen-record a trailer.`,
  "screenshot-round": `Screenshot the best moment and send it back. 2 or 3 rounds is where the wow comes from. After each round, re-run the art-director prompt on the same camera path you will use for the trailer.`,
};

if (g === "vice86") {
  const text = VICE86_ORIGINAL[resolvedStep] ?? VICE86_ORIGINAL.critique;
  console.log(`# Vice '86 (Godofprompt) · step: ${resolvedStep}\n\n${text}\n`);
  console.log(`City Nights mapping: ${root}/docs/GAME_POLISH_VICE86_PROMPTS.md`);
  process.exit(0);
}

const pkg = g === "city-nights" ? "drive-world" : "flight-nemulator";
const name = g === "city-nights" ? "City Nights" : "Battleworld";

const cityNights: Record<string, string> = {
  plan: `Lead designer — Tortuca City Nights (PlayCanvas, ${pkg}/). Plan the Bay: 4 regions + freeway spine, 3 vehicle fantasies from vehicle-catalog, HUD hex accents, weather (regional-weather.ts), controls/gamepad, procedural engine + playlist (no new MP3s). Five details that sell a real driving game for cn-d10. One cn-d0N slice. GAME_FINISH_PROGRAM.md.`,
  city: `Step 2/7 — Bay city read: streets, fog/exposure, hub streaming, storefronts, landmarks. FREEWAY_DRONE_BUDGET. Chase/bumper cams only.`,
  garage: `Step 3/7 — garage + drive feel: estate garage cam, vehicle swap, nitro-zone-feel.ts, drift scoring, boost VFX. Chromebook-safe. One message only.`,
  weather: `Step 4/7 — coastalWeatherEnabled, coastalRainAdjust, wet nitro grade, drones/traffic caps. Night via exposure/fog. test:playtest.`,
  sound: `Step 5/7 — game-audio.ts engine, heat siren, drift beeps; Music panel + ACE bed. Tap-to-unlock audio; optional R → playlist.`,
  critique: `Screenshot City Nights (${pkg}/): [attach PNG].

Art director 6/7: 5 fakest reads (light, colors, scale, empty lots, car shape, HUD). Fix only those 5.

Trailer: document 30s record path (autopilot/vista → rainy freeway → nitro). chase-camera-bob.ts as needed.

3 next fixes for console browser feel.`,
  "screenshot-round": `Step 7/7 — 2–3 rounds (nitro dusk or wet freeway). vice86-6 → test:playtest → same camera angle.`,
  "one-slice": `One cn-d0N row in GAME_FINISH_PROGRAM.md; game-finish:report.`,
};

const battleworld: Record<string, string> = {
  plan: `Plan Battleworld (${pkg}/): chapter 1–3 HUD, wave-10 pair, minimap H, arc chip. One bw-d0N slice.`,
  city: `District read: battleworld-districts.ts + sky-env.ts — nine rims distinct from orbit.`,
  garage: `One combat feel pass: vfx.ts trail fade + wave-combat-juice.ts shake. List 3 weak points.`,
  weather: `Perf caps: wave spawns, destruction $ tick, trail maxLife. No debris piles.`,
  sound: `game-audio.ts: wave alert, blast, whoosh — keep procedural; no new asset drops.`,
  critique: `Screenshot Battleworld (${pkg}/): [attach PNG].

Art director 6/7: 5 fakest reads (rim light, sky, particles, camera, HUD chips). Fix only those 5.

Clip path: 30s orbit → district fly-in → pair wave for screen record.

3 next fixes.`,
  "screenshot-round": `2–3 rounds on pair duel or orbit HUD. test:flight-nemulator.`,
  "one-slice": `One bw-d0N row; game-finish:report.`,
};

const prompts = g === "city-nights" ? cityNights : battleworld;
const text = prompts[resolvedStep];
if (!text) {
  console.error(`Unknown step "${step}". Use vice86-1..7 or plan|city|garage|weather|sound|critique|screenshot-round|one-slice.`);
  process.exit(1);
}

console.log(`# ${name} · Vice '86 step ${resolvedStep}\n\n${text}\n`);

if (g === "city-nights") {
  const original = VICE86_ORIGINAL[resolvedStep];
  if (original) {
    console.log(`---\nGodofprompt original:\n\n${original}\n`);
  }
}

console.log(`Docs: ${root}/docs/GAME_POLISH_LOOP.md · ${root}/docs/GAME_POLISH_VICE86_PROMPTS.md`);

void readFileSync(path.join(root, "docs/GAME_POLISH_VICE86_PROMPTS.md"), "utf8");