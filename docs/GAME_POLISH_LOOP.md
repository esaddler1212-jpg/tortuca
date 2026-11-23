# Game polish loop (screenshot → critic → one fix)

Godofprompt **Vice ’86** 7-step carousel (neon Miami driving) mapped to Tortuca **City Nights**. Same discipline for **Battleworld**: one step per message, 2–3 screenshot rounds.

**Full prompts:** [`GAME_POLISH_VICE86_PROMPTS.md`](./GAME_POLISH_VICE86_PROMPTS.md)

## Signature moments (capture these)

| Game | “Record this” moment | How to grab a frame |
|------|----------------------|---------------------|
| **City Nights** | Freeway nitro at dusk + rep chip moving | Skip Waymo → home → I-80 on-ramp → nitro stripe + chase cam |
| **City Nights** | Photo orbit at a vista | **P** at `cruise-vistas` pin; exposure slider mid-frame |
| **Battleworld** | Wave 10 pair duel | `npm run test:playtest` in `flight-nemulator/` or fly to wave chip |
| **Battleworld** | District rim + arc HUD | Orbit → hero pick → chapter objective readable |

Save PNGs under `drive-world/research/capture/` or `flight-nemulator/research/capture/` (**gitignore**).

## Seven prompts (Vice ’86 ↔ Tortuca)

| Step | Carousel | CLI | City Nights | Battleworld |
|------|----------|-----|-------------|-------------|
| **1/7** | Plan the game | `vice86-1` | Bay regions, vehicles, funnel | Chapter chain, pair moment, minimap **H** |
| **2/7** | Build the city | `vice86-2` | Bay map, fog, drones | District rims + sky |
| **3/7** | Garage & cars | `vice86-3` | Garage cam, nitro, drift | Combat juice + trails |
| **4/7** | Rain & night | `vice86-4` | Coastal weather, traffic cap | Wave/destruction caps |
| **5/7** | Sound | `vice86-5` | Engine + playlist bed | Wave/combat audio cues |
| **6/7** | Art director + trailer | `vice86-6` | Top 5 fake + 30s record path | Top 5 fake + orbit clip path |
| **7/7** | Repeat 2–3× | `vice86-7` | Same angle each round | Same |

### Prompt 6 — copy/paste

See [`GAME_POLISH_VICE86_PROMPTS.md`](./GAME_POLISH_VICE86_PROMPTS.md#prompt-67--the-fix-art-director--trailer).

Verify on `cursor/*-b076`: `npm run test:city-nights` or `npm run test:flight-nemulator`.

## CLI

```bash
npm run game:polish-prompt -- vice86 vice86-6           # original Instagram text
npm run game:polish-prompt -- city-nights vice86-5     # Tortuca sound pass
npm run game:polish-prompt -- battleworld vice86-6       # flight art-director pass
```

Aliases: `vice86-1`…`vice86-7`, or step names `plan` · `city` · `garage` · `weather` · `sound` · `critique` · `screenshot-round`

## Code hooks

| Hook | Where |
|------|--------|
| Chase cam bob | `drive-world/src/chase-camera-bob.ts` |
| Photo orbit + exposure | `drive-world/src/photo-mode.ts` |
| Combat trail fade + shake | `flight-nemulator/src/vfx.ts`, `wave-combat-juice.ts` |
| Finish % | `docs/GAME_FINISH_PROGRAM.md` |

## Agents

- One mechanic per commit; one finish slice per PR.
- `npm run game-finish:report -- …` after slice done.
- No API keys or PII in critique chats.