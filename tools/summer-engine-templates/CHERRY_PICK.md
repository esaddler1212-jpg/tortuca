# Summer Engine → Tortuca (PlayCanvas)

**Never** add Godot binaries, `.pck`, or GDScript runtime to `drive-world/` or `flight-nemulator/` deploy bundles. Use upstream for **reference runs** and copy patterns into existing TypeScript modules.

## How to study

1. `npm run summer-engine:bootstrap`
2. Open a clone in [Summer Engine](https://www.summerengine.com/download) or Godot 4.7.
3. Note one behavior, find the matching Tortuca file, implement **one slice** there.

## Template → Tortuca file map

### [Procedural road world](https://github.com/SummerEngine/template-3d-procedural-road-world)

| Upstream idea | GDScript entry | Tortuca target |
|---------------|----------------|----------------|
| Seeded terrain + road graph | `scripts/world_generator.gd` | `drive-world/src/world-config.ts`, `hub-streaming.ts`, Bay map research |
| Weather cycle (clear → fog) | F2 weather toggle | `regional-weather.ts`, `game-loop.ts` exposure/fog |
| Car presets SPORT / CHILL | vehicle profiles | `vehicle-catalog.ts`, `game-settings.ts` quality presets |
| District chunks | chunk loader | hub streaming + Chromebook caps (`freeway-traffic-drones.ts`) |

**Finish-program hooks:** perf/hub slices, semi-accurate Bay map research, traffic drones.

### [3D racing game](https://github.com/SummerEngine/template-3d-racing-game)

| Upstream idea | GDScript entry | Tortuca target |
|---------------|----------------|----------------|
| Ghost / best lap | race results + session | `cpm-ghost.ts`, `landmark-sprints.ts`, `ghostRivalLabel` HUD |
| Drift fills nitro | vehicle + race | `nitro-zone-feel.ts`, nitro charge in `game-loop.ts` |
| AI rival tiers Easy/Med/Hard | `game_session.gd` tables | heat chaser / ghost rival pacing (`heat-chaser.ts`) |
| Track authoring spline | `track_authoring/` | ghost sprint circuits (`sprint-circuit-roster.ts`) — **data shapes only** |

**Finish-program hooks:** ghost circuits, nitro zone, heat-5 cop chase (rival AI spacing).

### [Open-world explore TPS](https://github.com/SummerEngine/template-3d-open-world-explore-tps)

| Upstream idea | GDScript entry | Tortuca target |
|---------------|----------------|----------------|
| Orbit camera + arm collision | `third_person_camera.gd` | `camera-profiles.ts`, photo orbit (`photo-mode.ts`) |
| Interact + quest state | `adventure_quest_state.gd` | missions, taxi, journal (`game-progress.ts`) |
| Coyote time / jump buffer | `third_person_controller.gd` | only if on-foot expands beyond Waymo vignette |

**Finish-program hooks:** photo mode, chapter/objective HUD patterns (conceptually similar to relic quest).

### [Sakura Rally](https://github.com/SummerEngine/sakura-rally)

| Upstream idea | Notes | Tortuca target |
|---------------|-------|----------------|
| AI ghost + time trial | `G` ghost cars, trained rival | extend `cpm-ghost.ts` / ghost tapes with spline replay |
| Season blend along road | spring ↔ autumn | Tokyo flight + Bay coastal weather tuning |
| Cel-band shading | anime background read | **HUD** color bands only — do not replace PlayCanvas PBR |
| Launch control countdown | standing start | optional sprint start line UX at ghost circuits |

**Finish-program hooks:** Tokyo landmarks, ghost PB toasts, console feel (gamepad = rally bindings).

## Battleworld (Skyring)

Summer templates are **ground/race** first. Port only:

- **Screen shake + fade particles** discipline (Sakura crash forgiveness) → `flight-nemulator/src/vfx.ts`
- **Ghost replay** for a hero flight line → future slice; study Sakura `G` ghost + rally records
- **Orbit camera** when grounded in districts → district rim flight already covers sky read

## Licensing

| Repo | License |
|------|---------|
| procedural-road-world, racing-game, sakura-rally | MIT |
| open-world-explore-tps | See `asset_manifest/` in upstream — complete attribution before shipping derived **art** |

Porting **logic you re-type in TS** is fine; do not commit upstream meshes/audio into Tortuca without a license check.

## What not to do

- Embed Summer Engine marketplace or `npx summer-engine` in the Netlify PWA.
- Replace Bullet vehicle in City Nights with Jolt/Godot physics in one PR.
- Paste full GDScript files into `drive-world/` (agents will try to run them).