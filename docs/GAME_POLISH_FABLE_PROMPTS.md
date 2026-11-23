# Godofprompt FABLE carousel → Tortuca

**Also see:** neon driving carousel (Vice ’86 / Miami) → [`GAME_POLISH_VICE86_PROMPTS.md`](./GAME_POLISH_VICE86_PROMPTS.md)

Reference: the **7-prompt wizard-game carousel** (plan → meadow → first spell → breakables → more spells → screenshot critic → repeat). Tortuca already maps this to PlayCanvas **City Nights** and **Battleworld** in [`GAME_POLISH_LOOP.md`](./GAME_POLISH_LOOP.md).

**Rules from the carousel (keep for both stacks):**

| Discipline | FABLE wizard game | Tortuca |
|----------|-------------------|---------|
| Scope | One map, one day, no menus | One **finish slice** per PR (`cn-d0N` / `bw-d0N`) |
| Iteration | **One spell per message** | **One mechanic per commit** inside a slice |
| Juice | Full detail on the first spell before adding more | Nitro FOV **or** ghost PB **or** pair shake—not all at once |
| Polish | Screenshot → top 5 fake → fix only those → 2–3 rounds | Same; use `npm run game:polish-prompt -- … critique` |
| Assets | No models/textures; all code | No new GLB pipeline in a polish message; reuse Kenney/CC0 |

Print a step: `npm run game:polish-prompt -- city-nights fable-3` (or `battleworld fable-6`).  
Print the original wizard text: `npm run game:polish-prompt -- wizard fable-1`.

---

## Prompt 1/7 — THE PLAN

**Original (Three.js wizard):**

```text
You're a game designer. Plan a small first-person wizard game I'll build in the browser with Three.js. Give me: the world (a meadow with flowers, a stone tower, a cottage, a windmill, old ruins, trees), 7 spells with what each one does and its color, how the player moves and aims, and the one moment people will want to record. Keep it small enough to build in a day: one map, no enemies, no menus, just playing with magic.
```

**Tortuca — City Nights:**

```text
You're a game designer. Plan a small browser driving game in PlayCanvas (Tortuca City Nights, drive-world/). One map (Bay Area), no new menus. Give me: the 15-minute funnel (spawn → freeway → one ghost sprint or nitro hit), 3 HUD wins (street rep, nav leg, nitro read), speed-trap heat loop, and the one screenshot moment players will share. Keep scope to one finish slice (cn-d0N). Reference docs/GAME_FINISH_PROGRAM.md.
```

**Tortuca — Battleworld:**

```text
You're a game designer. Plan a small browser hero-flight game in PlayCanvas (flight-nemulator/). One Earth districts layer, chapter chain 1–3 on HUD. Give me: orbit district read, wave-10 pair moment, home **H** on minimap, arc/lattice chips, and the one clip people will record. One finish slice (bw-d0N). Reference docs/GAME_FINISH_PROGRAM.md.
```

---

## Prompt 2/7 — THE WORLD

**Original:**

```text
Build the world in one HTML file with Three.js loaded from a CDN link. No 3D model files and no image files: every mesh, texture and light is made in code. A bright meadow with tall grass that sways, blue and pink flowers, round trees, a stone tower, a cottage with a red roof and a windmill. Soft sun, long shadows, light fog in the distance. Walk with WASD and look around by dragging the mouse, with a wooden staff in the player's hand.
```

**Tortuca — City Nights:** Bay terrain + `regional-weather.ts` fog/exposure; freeway drones within `FREEWAY_DRONE_BUDGET`; hub streaming Chromebook preset. No new WGS84 mesh in the 3D sim.

**Tortuca — Battleworld:** `battleworld-districts.ts` rims + `sky-env.ts`; nine districts distinct from orbit. No new hero GLB in this message.

---

## Prompt 3/7 — THE FIRST SPELL

**Original:**

```text
Add a fire spell. When I click, a glowing rune circle appears where I aim, then a big explosion with flames, smoke, sparks and flying debris. The grass around it burns and turns black. Add a small screen shake and a bright flash. Make the sound with code, no sound files. Keep the world exactly as it is. Then tell me the 3 things that still feel weak and how you would fix them.
```

**Tortuca — City Nights:** One juice pass only—nitro zone FOV + canvas grade **or** ghost sprint PB toast (`nitro-zone-feel.ts`, `game-loop.ts`). Screen shake via existing feedback; procedural audio only (`game-audio.ts`). List 3 weak points after.

**Tortuca — Battleworld:** One juice pass—primary hit shake + boost trail fade (`vfx.ts`, `wave-combat-juice.ts`). Same “3 weak points” exit.

---

## Prompt 4/7 — THE PHYSICS (MAKE THINGS BREAK)

**Original:**

```text
Rebuild the tower, the cottage and the ruins from separate stone blocks and wooden planks, about 1,500 pieces in total. Write simple physics in code so pieces fall, roll and pile up when a spell hits them. The fire explosion should blow the tower apart. Keep it smooth on a normal laptop: let pieces rest once they stop moving and cap how many move at once. Keep everything else exactly the same.
```

**Tortuca — City Nights:** Perf, not literal rubble—`hub-streaming.ts` cadence, drone cap 3 on Chromebook, heat chaser as “pursuit physics.” Any new debris: sleep at rest, cap active movers.

**Tortuca — Battleworld:** Destruction $ + wave spawn caps; trail particles with `maxLife` and fade (`vfx.ts`). No uncapped rigidbody piles.

---

## Prompt 5/7 — THE MAGIC (ADD THE OTHER SPELLS)

**Original:**

```text
Add 6 more spells, each with its own color and rune circle: a purple black hole that pulls pieces in and crushes them, a fire tornado that lifts debris, frost that freezes the grass, lightning, a mind blast, and a growth spell that grows flowers and a full tree. Add a spell bar at the top with an icon drawn in code for each one, and number keys 1 to 7 to switch. Keep everything already built the same.
```

**Tortuca:** **One finish slice per message**—do not stack unrelated HUD/audio/combat in one PR. Examples after day 9: playlist bed (`cn-d09`), minimap H (`bw-d09`), gamepad QA (`cn-d10`). Spell-bar analogue: HUD chips that don’t overlap (rep, heat, chapter, arc objective).

---

## Prompt 6/7 — THE FIX (MAKE IT FEEL REAL)

**Original:**

```text
Here's a screenshot from my game: [upload]. Look at it like a game critic. List the 5 things that look or feel the most fake (colors, light, particles, physics, camera), worst first. Fix only those 5 and keep the rest the same. Add a little camera bob when walking, a staff swing when casting and particles that fade out slowly. Then tell me what you would fix next to make it look like a real game.
```

**Tortuca adaptation (attach PNG):**

```text
Here's a screenshot from my Tortuca game: [attach PNG].

Game: [City Nights | Battleworld]
Stack: PlayCanvas + TypeScript in [drive-world | flight-nemulator].

Act like a game critic. List the 5 things that look or feel the most fake (colors, light, particles, physics, camera, HUD), worst first.

Fix only those 5 in code. Keep everything else the same. Match existing patterns (no new engine).

When relevant, apply:
- City Nights: subtle chase camera bob at cruise speed (chase-camera-bob.ts), nitro FOV punch, heat/readability, particles that fade (vfx/trails).
- Battleworld: combat shake decay, boost trails fade slowly (vfx.ts), district rim/sky read, HUD chip clutter.

Then name the 3 things you would fix next for shippable console browser feel.
```

---

## Prompt 7/9 — REPEAT (screenshot rounds)

**Carousel tip:** “Screenshot the best moment and send it back. **2 or 3 rounds** is where the wow comes from.”

**Tortuca:**

1. Capture signature moment ([`GAME_POLISH_LOOP.md`](./GAME_POLISH_LOOP.md) table).
2. `npm run game:polish-prompt -- city-nights|battleworld critique`
3. Apply fixes; verify `test:city-nights` or `test:flight-nemulator`
4. Re-screenshot **same camera angle**. Repeat.

Save frames under `*/research/capture/` (gitignored).

---

## Claude / Fable note (informational)

The Instagram post describes a **browser wizard prototype built in one day** with procedural geometry and ~1,800 breakable pieces—useful as a **discipline reference**, not a stack to embed in Tortuca. Tortuca stays **PlayCanvas + Netlify + finish slices** per `AGENTS.md`.