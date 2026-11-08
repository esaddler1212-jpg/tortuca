# Battleworld character arcs

Fan-tribute only. Every playable hero in `hero-roster.ts` has a row in `battleworld-arcs.ts`. Arcs share one ladder on the same planet:

1. **Territory** — villains raid districts; heroes clear takeovers.
2. **Infinity Stones** — Thanos / Loki / Ultron homages race six stones; God Emperor tier like Doom.
3. **Pair rival** — wave-10 scripted boss (`hero-pair-boss.ts`).
4. **District beats** — **H** at signature turf (Lantern Coast, Ki Plateau, Stark Nexus) for corps / squad / iron links.

Special mechanics (not duplicated here): Solar Lantern safe house, Doom timeline / God Emperor, symbiote, Venom bonds, Cell/Buu absorption.

Progress bumps **Battleworld lattice** (`arc-progress.ts`) in localStorage. HUD shows `characterArcHint` under your codename.

Regenerate coverage check: `tsx scripts/check-battleworld-arcs.mts`.

## Pair boss policy

Wave **10** spawns one scripted rival (hero role only).

| Mode | Heroes | Boss pick |
|------|--------|-----------|
| **Pinned finale** | Tin Aviator, Red Codriver, Shade Knight, Solar Apex, Latverian Sovereign | Fixed villain in `PAIR_VILLAIN_PINNED` (`hero-pair-boss.ts`) |
| **Rival fallback** | Everyone else (hero alignment) | First villain in `villain-roster.ts` whose `rivalHeroIds` includes the hero |
| **Exempt** | Cell Mimic, Spirit Buu, Venom Echo (villain-only) | No wave-10 pair duel — villain runway / absorption arcs |

CI: `tsx scripts/check-pair-boss.mts` asserts every non-exempt hero has at least one rival villain and that `pairVillainForHero` returns a matching boss.

## Arc beats (lattice)

| Beat | When recorded |
|------|----------------|
| `territory-clear` | Hero clears the last takeover district (reclaim **H** or auto henchmen clear) |
| `stone-linked` / `hunt-ascended` | Infinity Stone interact / sixth stone |
| `corps-oath` / `squad-clash` | District **H** at Coast City / Ki Plateau |
| `home-mark` | District **H** at hero home turf (all roster; signature beats for Lantern/Ki/Iron still apply) |
| `pair-down` | Wave-10 pair boss defeated |
| `world-saved` | Hero save fate at ≥52% integrity |
