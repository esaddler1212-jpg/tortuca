# Game polish loop (screenshot → critic → one fix)

Adapts the **plan → world → one spell → breakables → add features one at a time → screenshot critic** workflow for Tortuca’s PlayCanvas games—not a single-file Three.js meadow. Use with **Nightshift** (`drive-world/`) and **Skyring** (`flight-nemulator/`).

## Signature moments (capture these)

| Game | “Record this” moment | How to grab a frame |
|------|----------------------|---------------------|
| **City Nights** | Freeway nitro at dusk + rep chip moving | Skip Waymo → home → I-80 on-ramp → nitro stripe + chase cam |
| **City Nights** | Photo orbit at a vista | **P** at `cruise-vistas` pin; exposure slider mid-frame |
| **Battleworld** | Wave 10 pair duel | `npm run test:playtest` in `flight-nemulator/` (headless) or fly to wave chip |
| **Battleworld** | District rim + arc HUD | Orbit Earth → pick hero → chapter objective readable |

Save PNGs under `drive-world/research/capture/` or `flight-nemulator/research/capture/` (**gitignore** — do not commit blobs).

## Seven prompts (Tortuca mapping)

| Step | Wizard-game idea | City Nights | Battleworld |
|------|------------------|-------------|-------------|
| 1 **Plan** | One-day scope, 7 spells | One **driving loop** + 3 HUD wins (rep, nav, nitro) | One **combat loop** + chapter 1–3 chain |
| 2 **World** | Procedural meadow | Bay terrain + district fog/exposure (`regional-weather.ts`) | District rims + sky (`battleworld-districts.ts`) |
| 3 **First spell** | One ability with full juice | **One** feel pass: nitro FOV + zone grade OR ghost sprint PB toast | **One** feel pass: wave juice + pair shake (`wave-combat-juice.ts`, `vfx.ts`) |
| 4 **Breakables** | 1500 pieces, cap active bodies | Traffic/sideshow **budgets** (`freeway-traffic-drones`, Chromebook cap) | Destruction $ + wanted meter (already capped per tick) |
| 5 **More spells** | One spell per message | **One slice per day** (`cn-d0N`) — no multi-feature PRs | **One slice per day** (`bw-d0N`) |
| 6 **Screenshot critic** | Top 5 fake things → fix | Below | Below |
| 7 **Repeat** | 2–3 rounds | Re-capture same moment after each round | Same |

### Prompt 6 — copy/paste (attach screenshot)

```text
Here's a screenshot from my Tortuca game: [attach PNG].

Game: [City Nights | Battleworld]
Stack: PlayCanvas + TypeScript in [drive-world | flight-nemulator].

Act like a game critic. List the 5 things that look or feel the most fake (colors, light, particles, physics, camera, HUD), worst first.

Fix only those 5 in code. Keep everything else the same. Match existing patterns (no new engine, no asset pipeline).

Then tell me the 3 things you would fix next to make it feel like a shippable console browser game.
```

Run fixes on a `cursor/*-b076` branch; verify with `npm run test:city-nights` or `npm run test:flight-nemulator`.

## CLI — print step prompts

```bash
npm run game:polish-prompt -- city-nights plan
npm run game:polish-prompt -- battleworld critique
npm run game:polish-prompt -- city-nights screenshot-round
```

## Code hooks shipped for the loop

| Hook | Where |
|------|--------|
| Chase cam bob (cruise speed) | `drive-world/src/chase-camera-bob.ts` |
| Photo orbit + exposure | `drive-world/src/photo-mode.ts` (slice `cn-d07`) |
| Combat trail fade + shake | `flight-nemulator/src/vfx.ts`, `wave-combat-juice.ts` |
| Finish % + DoD | `docs/GAME_FINISH_PROGRAM.md` |

## Agents

- After a polish round that completes a slice: `npm run game-finish:report -- …`
- Do **not** paste API keys or PII into critique chats.
- Prefer **one mechanic per commit** inside a slice (same discipline as “one spell per message”).