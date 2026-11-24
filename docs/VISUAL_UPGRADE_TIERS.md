# Visual upgrade tiers (City Nights + Battleworld)

Single checklist for **couch/TV “real enough”** reads: coastal fog, silhouettes, motion, sky — not photoreal Bay geography. Pair with [`FREE_3D_BUILDING_ASSETS.md`](./FREE_3D_BUILDING_ASSETS.md) and [`GAMEDEV_RESOURCES.md`](./GAMEDEV_RESOURCES.md).

**North star:** [`CITY_NIGHTS_ART_BRIEF.md`](./CITY_NIGHTS_ART_BRIEF.md) (emissive night + `night-palette.ts`), [`BATTLEWORLD_ART_BRIEF.md`](./BATTLEWORLD_ART_BRIEF.md) (HUD + district read).

---

## Tier 0 — No downloads (&lt; 5 minutes)

| # | Action | Game | Wired in code |
|---|--------|------|----------------|
| 1 | **Lush nights** or **Console / TV** quality preset | City Nights | `bay-quality.ts`, Settings → Bay quality |
| 2 | **Traffic on** (freeway drones + hub streets) | City Nights | `showTraffic` in `game-settings.ts` |
| 3 | **Coastal weather on** | City Nights | `coastalWeatherEnabled` → `regional-weather.ts` |
| 4 | **Fuel sim** + gas stops (optional) | City Nights | More “lived-in” loop around pumps |
| 5 | **Photo mode exposure** (P) | City Nights | Sell night grade in captures |
| 6 | **Medium / High** graphics quality | Battleworld | Poly Haven sky CDN in `sky-env.ts` |
| 7 | Hero panel **Story & arc details** collapsed by default | Battleworld | `hero-picker-more` in `HudApp.tsx` |

**When to stop:** Quick couch pass before installing any GLBs.

---

## Tier 1 — One command, already wired (highest ROI)

Run from repo root:

```bash
bash tools/gamedev-resources/install-free-packs.sh --city-glb   # minimum
# or
bash tools/gamedev-resources/install-free-packs.sh --all         # city + modular on disk + interface audio
```

| Flag | Output path (gitignored) | City Nights | Battleworld |
|------|--------------------------|-------------|-------------|
| `--city-glb` | `*/public/models/kenney-city/` + `index.json` | Kenney ring at **6** Bay anchors (`placeDistrictKenneyProps`) | Scattered landmarks + **4× per district** skyline |
| `--modular-glb` | `*/public/models/kenney-modular/` + `index.json` | **Wired** — `placeDistrictModularProps` at each Bay anchor | **Wired** — `placeDistrictKenneyModular` per district |
| `--city-glb-full` | Same as city (all GLBs from kit clone) | More building variety | Same |
| `--pbr-decks` | `drive-world/public/textures/ambientcg/deck-asphalt.jpg` | **Wired** — `kitDeckMaterial` on art-kit plazas | — |
| `--audio` | `flight-nemulator/public/audio/kenney/` | — | UI-style SFX |
| `--all` | All of the above | | |

**Depth trick:** Installer copies **24** city GLBs. Drop more `.glb` files into `kenney-city/` and regenerate `index.json` (same schema as installer) for less repetition.

**Credits:** Update `drive-world/public/models/CREDITS.md` and `flight-nemulator/public/models/CREDITS.md` if you ship assets in production.

### Already in git (no install)

| Asset | Path | License |
|-------|------|---------|
| Kenney Car Kit | `drive-world/public/models/kenney/*.glb` | CC0 |
| Light Helicopter | `drive-world/public/models/cc0/helicopter.glb` | CC0 |
| Default hero GLBs | `flight-nemulator/public/models/heroes/*.glb` | rebuild: `npm run build:glb` |

---

## Tier 2 — Local manual drops (low effort, selective)

| # | Source | How | Best for |
|---|--------|-----|----------|
| 1 | **World Gacha** | Export GLB → `flight-nemulator/public/models/worldgacha/` + `index.json` | One recognizable **town skyline** ([`WORLDGACHA_WORKFLOW.md`](./WORLDGACHA_WORKFLOW.md)) |
| 2 | **Extra heroes / nemesis** | `cd flight-nemulator && npm run build:glb` | Flight silhouettes vs boxes |
| 3 | **Poly Pizza CC0** (e.g. [City Builder Bits](https://poly.pizza/bundle/City-Builder-Bits-1wLdnIddSx)) | Copy `.glb` into `kenney-city/`, append to `index.json` | **Hero landmarks** (arena, pier, tower) |
| 4 | **Poly Haven** models | `public/models/cc0/<name>.glb` + one-off spawn | Pier / warehouse at a landmark |
| 5 | Full **Kenney City zip** | [kenney.nl](https://kenney.nl/assets/city-kit-commercial) if sparse clone fails | Replace or extend `kenney-city/` |

---

## Tier 3 — Small engineering (high payoff)

Track in art slices / PRs — not required for local dev.

| # | Work | Effort | Payoff |
|---|------|--------|--------|
| 1 | **Wire `kenney-modular/`** | **Shipped** | `placeDistrictModularProps` / `placeDistrictKenneyModular` |
| 2 | **`--city-glb-full`** + default cap **48** | **Shipped** | `install-free-packs.sh` |
| 3 | **`--pbr-decks`** + `kitDeckMaterial` | **Shipped** | `deck-pbr.ts`, art-kit plaza decks |
| 4 | **District rim lights** | **Shipped** | `build-district-rim-lights.ts` |
| 5 | **Six Bay anchor kits** | **Shipped** | `shared/art-district-manifest.json` |
| 6 | **Vice ’86 density pass** | **Todo** | [`GAME_POLISH_VICE86_PROMPTS.md`](./GAME_POLISH_VICE86_PROMPTS.md) |

---

## Tier 4 — Medium effort (spot realism)

| # | Idea | Game | Notes |
|---|------|------|--------|
| 1 | Kenney **Roads** / **Suburban** / **Nature** | City Nights | Freeway props, palms — extend `install-free-packs.sh` or manual |
| 2 | **Hub / freeway** Kenney slots (not only 6 anchors) | City Nights | I-80, 101, hub mazes — drives between landmarks |
| 3 | **HUD map underlay** | City Nights | [`semi-accurate-bay-map`](../drive-world/research/findings/2026-11-13-semi-accurate-bay-map.md) — geography **on map**, not full 3D |
| 4 | **World Gacha** satellite files | Battleworld | `files[]` in `worldgacha/index.json` |
| 5 | **Poly Haven** local HDRIs | Both | Battleworld uses CDN sky; City Nights would need new sky path for parity |
| 6 | **game-icons.net** HUD icons | Battleworld | CC BY — line in `CREDITS.md` |

---

## Tier 5 — Heavy (defer unless goal is sim-Bay)

| # | Idea | Why later |
|---|------|-----------|
| 1 | OSM / Location Scout **3D** geometry | Attribution, scale, perf — tools terms |
| 2 | Full PBR on every building | Fights low-poly + `night-palette` contract |
| 3 | Photoreal geo driving (lat/lng in sim) | Explicitly out of scope for shipping 3D (`GAME_FINISH_PROGRAM.md`) |
| 4 | Bulk third-party marketplaces in PWA | `AGENTS.md` — optional docs/links only |

---

## Short “do this” order

1. Tier **0** settings on both games.  
2. Tier **1** `install-free-packs.sh --city-glb` (or `--all`).  
3. Drive / fly the **six manifest anchors** — confirm Kenney silhouettes.  
4. Tier **2** one World Gacha GLB (Battleworld) + optional Poly Pizza hero building.  
5. Tier **3** when coding: modular loader → bigger city install → AmbientCG decks.

---

## Per-game cheat sheet

### City Nights (`drive-world/`)

| Priority | Tier |
|----------|------|
| 1 | 0 — Lush/Console + coastal weather + traffic |
| 2 | 1 — `--city-glb` |
| 3 | 3 — modular loader + asphalt materials |
| 4 | 4 — Roads/Nature Kenney on freeways |
| 5 | 4 — HUD map underlay (recognition without 3D geo) |

### Battleworld (`flight-nemulator/`)

| Priority | Tier |
|----------|------|
| 1 | 0 — High quality + clean HUD |
| 2 | 1 — `--city-glb` |
| 3 | 2 — World Gacha centerpiece |
| 4 | 2 — `npm run build:glb` for more heroes |
| 5 | 3 — rim lights + skyline (shipped) → modular + VFX polish |

---

## Verify after visual changes

```bash
# City Nights
cd drive-world && npm run build && npm run test:vallejo-art && npm run test:playtest

# Battleworld
cd flight-nemulator && npm run build && npm run test:battleworld
```

Optional couch QA: [`CITY_NIGHTS_CONSOLE_FEEL.md`](./CITY_NIGHTS_CONSOLE_FEEL.md), [`BATTLEWORLD_CONSOLE_FEEL.md`](./BATTLEWORLD_CONSOLE_FEEL.md).