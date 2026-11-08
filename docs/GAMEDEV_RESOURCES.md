# GameDev resources for Tortuca games

We comb multiple **free resource indexes**:

| Source | Tortuca slice |
|--------|----------------|
| [Kavex/GameDev-Resources](https://github.com/Kavex/GameDev-Resources) | [`tortuca-playcanvas.json`](../gamedev-resources/tortuca-playcanvas.json) — assets, audio, tools |
| [public-apis/public-apis](https://github.com/public-apis/public-apis) | [`tortuca-public-apis.json`](../gamedev-resources/tortuca-public-apis.json) — browser-safe APIs |
| [GitHub **game-engines** collection](https://github.com/collections/game-engines) | [`tortuca-game-engines.json`](../gamedev-resources/tortuca-game-engines.json) |
| [JannisX11/blockbench](https://github.com/JannisX11/blockbench) | [`BLOCKBENCH_WORKFLOW.md`](./BLOCKBENCH_WORKFLOW.md) — hero GLB pipeline |

## Quick commands

| Command | Purpose |
|---------|---------|
| `npm run gamedev-resources:sync` | Pin upstream commits (Kavex + public-apis) |
| `bash tools/gamedev-resources/install-free-packs.sh --all` | Pull CC0 Kenney audio + city GLBs locally |

### Wired in Flight Nemulator (runtime)

| Source | Feature |
|--------|---------|
| Poly Haven (CDN) | Sky equirectangular on medium/high quality |
| Open-Meteo | Bay cloud cover → fog mood |
| FreeToGame + GamerPower | HUD “free games” hints in cached manifest |
| JokeAPI + Open5e SRD | Tap screen + HUD tips |
| 3DTexel public API | Research panel CC0 texture hits |
| Blockbench GLB | `public/models/heroes/<hero-id>.glb` via `hero-gltf.ts` |
| Kenney City Kit | `kenney-city/*.glb` + `index.json` landmarks |

## Already in repo

| Asset | Game | License |
|-------|------|---------|
| Kenney Car Kit GLBs | `drive-world/public/models/kenney/` | CC0 |
| Light Helicopter | `drive-world/public/models/cc0/` | CC0 |

## Best fits for next art passes

### Flight Nemulator

- **3D:** [Poly Pizza](https://poly.pizza), [Poly Haven](https://polyhaven.com) models, Kenney City Kit (install script)
- **Sky / PBR:** Poly Haven HDRIs, AmbientCG materials
- **SFX:** Kenney interface sounds (install script), [jfxr](https://jfxr.frozenfractal.com) for custom blasts
- **HUD icons:** [game-icons.net](https://game-icons.net) (CC BY — credit in `CREDITS.md`)

### City Nights (`drive-world`)

- Kenney packs (vehicles done), AmbientCG for road materials
- Freesound / FreePD for radio stingers (per-file license)

## Engines & learning (from Kavex list)

- **PlayCanvas** — our runtime ([PLAYCANVAS_INBROWSER_GAME.md](./PLAYCANVAS_INBROWSER_GAME.md))
- **3D Game Shaders For Beginners** — juice for destruction / flight trails
- **ecs-lib** — optional if we outgrow ad-hoc game loops

## Do not auto-bundle

- **Kavex/GameSounds** (GPL-3.0) — link only, do not commit into static `public/` without compliance review
- **Unity/Unreal** entries marked `:free:` in Kavex README — editor licenses ≠ CC0 asset packs

Always read the license on the destination site before release.
