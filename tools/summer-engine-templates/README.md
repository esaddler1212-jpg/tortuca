# Summer Engine templates (reference)

MIT **Godot 4 / Summer Engine** starters from [SummerEngine](https://github.com/SummerEngine). Tortuca **City Nights** and **Battleworld** stay **PlayCanvas in the browser** — these repos are for **local study**, not runtime imports.

## Bootstrap

```bash
npm run summer-engine:bootstrap
SUMMER_ENGINE_PULL=1 npm run summer-engine:bootstrap   # refresh clones
```

Clones land in `tools/summer-engine-templates/upstream/` (gitignored).

## Catalog

| Template | Repo | Tortuca use |
|----------|------|-------------|
| Procedural road world | [template-3d-procedural-road-world](https://github.com/SummerEngine/template-3d-procedural-road-world) | Bay roads, chunks, weather |
| 3D racing | [template-3d-racing-game](https://github.com/SummerEngine/template-3d-racing-game) | Ghost sprints, rivals, nitro |
| Open-world TPS | [template-3d-open-world-explore-tps](https://github.com/SummerEngine/template-3d-open-world-explore-tps) | Orbit cam, quests |
| Sakura Rally | [sakura-rally](https://github.com/SummerEngine/sakura-rally) | Ghost AI, seasonal tone (Tokyo/Haneda vibes) |

Full mapping: [`docs/SUMMER_ENGINE_TEMPLATES.md`](../../docs/SUMMER_ENGINE_TEMPLATES.md).

## Cherry-pick

See [`CHERRY_PICK.md`](./CHERRY_PICK.md) — port **math and UX**, not `.tscn` / `.gd` into Netlify.