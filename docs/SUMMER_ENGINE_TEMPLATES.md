# Summer Engine templates for Tortuca games

Four open [Summer Engine](https://www.summerengine.com/templates) **Godot 4** starters you linked — indexed for **finishing City Nights** (PlayCanvas `drive-world/`). They do **not** replace our stack; they shorten research for driving, ghosts, open-world UX, and rally feel.

## Quick links

| Template | GitHub | Best for Tortuca |
|----------|--------|------------------|
| Procedural road world | [template-3d-procedural-road-world](https://github.com/SummerEngine/template-3d-procedural-road-world) | Seeded roads, chunks, weather, traffic ideas |
| 3D racing | [template-3d-racing-game](https://github.com/SummerEngine/template-3d-racing-game) | Ghost laps, drift→nitro, rivals, track data |
| Open-world TPS | [template-3d-open-world-explore-tps](https://github.com/SummerEngine/template-3d-open-world-explore-tps) | Orbit camera, quests, interactables |
| Sakura Rally | [sakura-rally](https://github.com/SummerEngine/sakura-rally) | Ghost AI, seasonal routes, Tokyo-adjacent tone |

## Local clone (gitignored)

```bash
npm run summer-engine:bootstrap
```

Paths: `tools/summer-engine-templates/upstream/*`  
Cherry-pick rules: [`tools/summer-engine-templates/CHERRY_PICK.md`](../tools/summer-engine-templates/CHERRY_PICK.md)

## Finish-the-games playbook

Use **one template focus per finish slice** (same discipline as “one spell per message”):

1. **Ghost + rival** — read `template-3d-racing-game` + Sakura ghost keys → implement in `cpm-ghost.ts` / sprint HUD only.
2. **Road + weather** — read procedural road world → tune `regional-weather.ts` or Bay map finding, not a new engine.
3. **Camera / photo** — read TPS orbit cam → adjust `camera-profiles.ts` / `photo-mode.ts`.
4. **Tokyo / seasons** — skim Sakura liaison road → inform Tokyo flight + music bed prompts (`ace-step`).

Research note with file paths: [`drive-world/research/findings/2026-11-22-summer-engine-tortuca-map.md`](../drive-world/research/findings/2026-11-22-summer-engine-tortuca-map.md).

## IRIS / deploy guardrails

- Templates stay **off** Alfred and VantageGames bundles.
- Do not add Summer Engine download links inside the kids’ PWA shell unless product asks.
- Agents: cite this doc when proposing ports; keep diffs in PlayCanvas TypeScript.