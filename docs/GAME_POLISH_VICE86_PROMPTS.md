# Godofprompt Vice ’86 / neon driving carousel → City Nights

Second **7-prompt carousel** from Godofprompt: **neon 1986 Miami open-world driving** in one HTML file (Three.js). Tortuca’s analogue is **City Nights** (`drive-world/`) — Bay night drive, MC/FH feel, procedural audio, coastal weather.

**Wizard FABLE carousel:** [`GAME_POLISH_FABLE_PROMPTS.md`](./GAME_POLISH_FABLE_PROMPTS.md)

**CLI**

```bash
npm run game:polish-prompt -- vice86 vice86-1    # original Miami plan text
npm run game:polish-prompt -- city-nights vice86-4 # Tortuca weather pass
npm run game:polish-prompt -- city-nights vice86-6 # art-director + trailer note
```

Same discipline: **one step per message**, screenshot rounds (2–3×), no new asset pipeline in a polish chat.

---

## Prompt 1/7 — THE PLAN

**Original (Fable 5.2 / Claude):**

```text
You're a lead designer at a big game studio. Plan a 3D open-world driving game set in a neon 1986 Miami that runs in one HTML file. Give me: 4 areas of the city (beach strip, downtown, a bridge, the docks), 3 classic 80s sports cars, the colors as hex codes, the time of day and weather, the controls, the sounds, and the 5 details that will make players say “this looks like GTA.”
```

**City Nights (Tortuca):**

```text
You're a lead designer for Tortuca City Nights (PlayCanvas, drive-world/). Plan the Bay like a festival open world—not one HTML file, but one browser build.

Deliver:
- 4 regions players name in conversation (SF core, Marin, East Bay, South Bay) plus freeway spine
- 3 vehicle fantasies from vehicle-catalog (starter, ghost rival class, nitro unlock)
- Hex accents for HUD/nitro stripe (match existing CSS, don’t invent a new palette system)
- Time-of-day + weather (coastalWeatherEnabled, regional-weather.ts)
- Controls (WASD, Shift nitro, gamepad hub)
- Sound plan: procedural engine + playlist bed (game-audio.ts, music-playlist.ts)—no new licensed MP3s in repo
- 5 “this looks like a real driving game” details tied to cn-d10 funnel QA

Scope: one finish slice (cn-d0N). See docs/GAME_FINISH_PROGRAM.md and CITY_NIGHTS_FEEL.md.
```

---

## Prompt 2/7 — THE CITY

**Original:**

```text
Build the city in one HTML file with Three.js loaded from a CDN link. No 3D model files and no image files: every mesh, texture and light is made in code. Roads with lane lines, sidewalks, palm trees, pastel art deco hotels, a beach, a long bridge over water, and pink and blue neon signs. Sunset sky, light fog. I can drive a car with WASD and the camera follows from behind.
```

**City Nights:**

```text
Polish the Bay city read without new GLB drops: street-name-registry, regional fog/exposure, hub streaming shells, storefront strips, landmark pins. Freeway drones within FREEWAY_DRONE_BUDGET. Camera stays chase/bumper profiles (camera-profiles.ts). Keep saves and netlify bundle size. Reference semi-accurate Bay map research—not Vice tiles in 3D.
```

---

## Prompt 3/7 — THE CARS (garage)

**Original:**

```text
Add a garage as the start screen: a dark room with pink neon lights, a glowing “Vice ’86” sign and a car turning slowly on a round platform with a shiny floor. Let me switch between 3 cars made from shapes in code: a red wedge supercar, a black classic coupe and a white convertible. Then add driving feel: speed builds up, the car leans in turns, drifts a little and shoots flames on boost (Shift).
```

**City Nights:**

```text
One garage/driving feel pass only: estate garage interior cam, vehicle swap, applied tuning, nitro zone FOV (nitro-zone-feel.ts), drift scoring (cpm-scoring.ts), nitro flames via existing VFX/audio. Three cars = pick from unlock roster, not new meshes. Lean/drift must stay Chromebook-safe. Do not rebuild the whole garage UI in the same message.
```

---

## Prompt 4/7 — THE WEATHER

**Original:**

```text
Add a day-to-night cycle: sunset, then night with street lamps, neon glowing on the walls and car headlights. Add rain that starts and stops: falling drops, wet roads that reflect the lights, and drops on the screen when the camera faces forward. Add traffic: 20 simple cars driving in their lanes and stopping when I block them. Keep it smooth on a normal laptop and keep everything else the same.
```

**City Nights:**

```text
Weather/traffic pass: coastalWeatherEnabled, coastalRainAdjust, nitro zone grade on wet feel, ambient traffic + freeway-traffic-drones (cap 3 on Chromebook). Night read via exposure/fog—not a full GTA traffic sim. If adding rain screen drops, gate behind Lush/balanced preset only. One commit; test:playtest green.
```

---

## Prompt 5/7 — THE SOUND

**Original:**

```text
Add sound made with code, no sound files: an engine that gets higher as I speed up and drops when I brake, tires that squeal in drifts, rain and thunder, and an 80s synth radio that plays a simple looping beat. Add a “Start engine” button that starts all sound (browsers block sound before a click) and an R key to switch the radio on and off. Keep the rest the same.
```

**City Nights:**

```text
Procedural + playlist audio only: updateEngineAudio in game-audio.ts, heat siren, drift/tree beeps; Music panel “ACE finish bed” / playlist (cn-d09). Tap-to-unlock pattern already exists—don’t add duplicate start buttons. Optional: R toggles musicUsePlaylist in game-settings if not wired. No copyrighted radio rips.
```

---

## Prompt 6/7 — THE FIX (art director + trailer)

**Original:**

```text
Here’s a screenshot of my game: [upload]. Look at it like an art director at a big game studio. List the 5 things that look the most fake (light, colors, scale, empty spots, car shapes), worst first. Fix only those 5 and keep the rest the same. Then add a 30-second camera tour that flies over the city, drops behind the car and drives through the rain, so I can screen-record a trailer.
```

**City Nights:**

```text
Here's a screenshot from City Nights (PlayCanvas, drive-world/): [attach PNG].

Act like an art director. List the 5 fakest reads (light, colors, scale, empty lots, vehicle silhouette, HUD), worst first. Fix only those 5 in TypeScript.

Trailer analogue (don’t block the fix list): document a 30s capture path—autopilot tour preset OR vista pin → freeway on-ramp in rain → nitro stripe—for screen recording. Reuse photo mode / chase bob; no new cinematic engine in the same PR unless cn-d10 scope.

2–3 screenshot rounds on the same angle. See GAME_POLISH_LOOP.md.
```

---

## Prompt 7/7 — REPEAT

Same as FABLE: **2 or 3 rounds** where the wow shows up. Capture nitro-at-dusk or wet-freeway moment; run `vice86-6`; verify `npm run test:city-nights`.