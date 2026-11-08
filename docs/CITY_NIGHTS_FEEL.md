# City Nights — feel pillars (CPM2 × Forza × Midnight Club)

City Nights is built as a **solo** mashup of three reference games. Features map to pillars as follows.

## CPM2 — skill loops & social lot culture

| Feel | In game |
|------|---------|
| Parking stars & valet bays | `landmark-parking.ts`, chapter objectives |
| Drift pads + live meter | `cpm-scoring.ts`, HUD **RacingHud** |
| Drag tree **3-2-1-GO** | `tickDragStrip` staging + amber tree HUD |
| Meets & sideshows | `sideshow-meets.ts`, Vallejo yard badge |
| Garage dyno & courier gigs | `vehicle-dyno.ts`, `cpm-taxi.ts` |
| Chapter 1 Vallejo gate | `mission-chapters.ts` |

## Forza Horizon — festival polish & collection

| Feel | In game |
|------|---------|
| Scenic routes & vistas | `world-extras.ts`, cruise vistas, vista cam |
| Photo / showcase | Photo mode **slow-mo** (`app.timeScale`), cruise cards |
| PB celebrations | Extended toasts + chimes on drift/drag/time PBs |
| Region cars & collectibles | `vehicle-catalog.ts`, homage fleet |
| Quality presets | `bay-quality.ts` (Chromebook → Lush) |
| Autopilot “tour” cruise | Night Coil + presets |

## Midnight Club — Bay night street racing

| Feel | In game |
|------|---------|
| Open districts & fast travel | `world-extras.ts`, gated until Chapter 1 done |
| **N₂O tank** + underglow pulse | `nitroCharge` in `game-loop.ts`, `drive-feel.ts` |
| FOV punch on boost | `applyCameraFovBoost` |
| Speed-trap **heat** | `game-heat.ts`, hunted pulse at high heat |
| Underglow & exhaust tuning | Garage sliders → `vehicle-factory.ts` |
| Street names & radio | `street-name-registry.ts`, `game-music.ts` |

## HUD label

Mission board summary: **Missions · CPM · Horizon · MC** — three genres, one Bay night loop.

## Research loop (browser excellence)

Use **[Craft Anything](https://github.com/storytold/craft-anything)** via Tortuca’s pinned CLI + Cursor MCP to study **legal** targets (our deploy, local dev, PlayCanvas/MDN docs, OSS web demos) and record recommendations in `drive-world/research/findings/`. Setup: [`CITY_NIGHTS_CRAFT_ANYTHING.md`](CITY_NIGHTS_CRAFT_ANYTHING.md).

## Next feel upgrades (backlog)

- Cop chaser box at heat 5 (no multiplayer required)
- Denser reactive traffic on main arteries
- Photo orbit + exposure slider
- Sideshow donut score tied to yaw rate
- Wet-road specular pass (quality: Lush only)
