# Battleworld character arcs

Fan-tribute only. Every playable hero in `hero-roster.ts` has a row in `battleworld-arcs.ts`. Arcs share one ladder on the same planet:

1. **Territory** — villains raid districts; heroes clear takeovers.
2. **Infinity Stones** — Thanos / Loki / Ultron homages race six stones; God Emperor tier like Doom.
3. **Pair rival** — wave-10 scripted boss (`hero-pair-boss.ts`).
4. **District beats** — **H** at signature turf (Lantern Coast, Ki Plateau, Stark Nexus) for corps / squad / iron links.

Special mechanics (not duplicated here): Solar Lantern safe house, Doom timeline / God Emperor, symbiote, Venom bonds, Cell/Buu absorption.

Progress bumps **Battleworld lattice** (`arc-progress.ts`) in localStorage. HUD shows `characterArcHint` under your codename.

Regenerate coverage check: `tsx scripts/check-battleworld-arcs.mts`.
