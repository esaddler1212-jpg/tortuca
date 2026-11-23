# Summer Engine templates → City Nights map

**Date:** 2026-11-22  
**Sources:** SummerEngine GitHub (MIT / other per repo)  
**Status:** Reference only — no Godot runtime in PlayCanvas build

## Why these repos

Summer Engine ships **complete browser-runnable Godot 4 slices** (driving, rally, procedural world, TPS quest). Tortuca already has Bullet cars, ghost sprints, nitro, and Bay terrain in TypeScript. The win is **proven UX loops** and **data layouts**, not scene import.

## Priority cherry-picks (next slices)

| Order | Template | Idea | Tortuca file | Risk |
|-------|----------|------|--------------|------|
| 1 | Racing | Ghost lap + AI difficulty table | `cpm-ghost.ts`, `heat-chaser.ts` | Low |
| 2 | Racing | Drift charges boost meter | `game-loop.ts` nitro charge | Medium (feel tuning) |
| 3 | Sakura | Ghost replay spline | new helper beside `cpm-ghost` | Medium |
| 4 | Procedural | Road graph + chunk budget | hub streaming / Bay map doc | Medium |
| 5 | TPS | Orbit cam collision | `camera-profiles.ts` | Low |
| 6 | Sakura | Season color along route | Tokyo + coastal weather | Low (art only) |

## Not worth porting wholesale

- Jolt 120 Hz vehicle in Sakura (we use Bullet + PlayCanvas).
- Full procedural 1152×1152 m world (Bay is authored + semi-accurate research).
- TPS robot hero / inventory (out of City Nights scope unless Waymo on-foot expands).

## Agent prompt (study one template)

```text
I cloned SummerEngine/template-3d-racing-game under tools/summer-engine-templates/upstream/racing-game.

Read scripts/game/game_session.gd and scripts/race/ for ghost lap flow only.

Propose a minimal diff for drive-world/src/cpm-ghost.ts and HudApp ghost strip — PlayCanvas TS only, no GDScript.
Keep npm run test:playtest green.
```

## See also

- [`docs/SUMMER_ENGINE_TEMPLATES.md`](../../../docs/SUMMER_ENGINE_TEMPLATES.md)
- [`tools/summer-engine-templates/CHERRY_PICK.md`](../../../tools/summer-engine-templates/CHERRY_PICK.md)