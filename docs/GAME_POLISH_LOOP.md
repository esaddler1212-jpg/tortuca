# Game polish loop (screenshot → critic → one fix)

Adapts the **Godofprompt FABLE 7-step carousel** (plan → world → first spell → breakables → more spells → screenshot critic → 2–3 rounds) for Tortuca’s PlayCanvas games—not a single-file Three.js meadow. Use with **Nightshift** (`drive-world/`) and **Skyring** (`flight-nemulator/`).

**Full verbatim originals + Tortuca copy:** [`GAME_POLISH_FABLE_PROMPTS.md`](./GAME_POLISH_FABLE_PROMPTS.md)

## Signature moments (capture these)

| Game | “Record this” moment | How to grab a frame |
|------|----------------------|---------------------|
| **City Nights** | Freeway nitro at dusk + rep chip moving | Skip Waymo → home → I-80 on-ramp → nitro stripe + chase cam |
| **City Nights** | Photo orbit at a vista | **P** at `cruise-vistas` pin; exposure slider mid-frame |
| **Battleworld** | Wave 10 pair duel | `npm run test:playtest` in `flight-nemulator/` (headless) or fly to wave chip |
| **Battleworld** | District rim + arc HUD | Orbit Earth → pick hero → chapter objective readable |

Save PNGs under `drive-world/research/capture/` or `flight-nemulator/research/capture/` (**gitignore** — do not commit blobs).

## Seven prompts (FABLE ↔ Tortuca)

| FABLE step | Wizard-game idea | CLI `fable-N` | City Nights | Battleworld |
|------------|------------------|---------------|-------------|-------------|
| **1/7 Plan** | One-day scope, 7 spells | `fable-1` / `plan` | Driving loop + 3 HUD wins + record moment | Chapter chain + pair moment + **H** on map |
| **2/7 World** | Procedural meadow, one HTML file | `fable-2` / `world` | `regional-weather.ts`, drone budget | District rims + `sky-env.ts` |
| **3/7 First spell** | Fire spell + critique 3 weak points | `fable-3` / `first-spell` | Nitro FOV **or** ghost PB toast | Wave juice + trail fade |
| **4/7 Breakables** | ~1500 pieces, sleep + cap movers | `fable-4` / `breakables` | Hub stream + Chromebook cap | Wave/destruction caps, trail `maxLife` |
| **5/7 More spells** | **One spell per message**, spell bar 1–7 | `fable-5` / `more-spells` | **One slice** (`cn-d0N`) per PR | **One slice** (`bw-d0N`) per PR |
| **6/7 Fix real** | Top 5 fake + bob/swing/fade | `fable-6` / `critique` | `chase-camera-bob.ts`, fade trails | Shake + trail fade, HUD chips |
| **7/7 Repeat** | 2–3 screenshot rounds | `fable-7` / `screenshot-round` | Same camera angle each round | Same |

### Prompt 6/7 — copy/paste (attach screenshot)

Same as FABLE prompt 6; Tortuca adds HUD + stack lines and maps “walking bob / staff swing / slow fade” to chase bob, boost/nitro punch, and `vfx` trail decay. Full text: [`GAME_POLISH_FABLE_PROMPTS.md`](./GAME_POLISH_FABLE_PROMPTS.md#prompt-67--the-fix-make-it-feel-real).

Run fixes on a `cursor/*-b076` branch; verify with `npm run test:city-nights` or `npm run test:flight-nemulator`.

## CLI — print step prompts

```bash
npm run game:polish-prompt -- city-nights fable-1    # plan
npm run game:polish-prompt -- battleworld fable-6   # screenshot critic
npm run game:polish-prompt -- city-nights screenshot-round
npm run game:polish-prompt -- wizard fable-3        # original Three.js first-spell text
```

Aliases still work: `plan`, `world`, `first-spell`, `breakables`, `more-spells`, `critique`, `one-slice`.

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