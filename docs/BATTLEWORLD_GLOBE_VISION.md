# Battleworld — 3D globe vision (product north star)

**Owner direction (Nov 2026):** Replace the “flat ring + box city” feel with a **real 3D globe** heroes can orbit and explore, where **each character’s city** reads as its own place on the planet — not one shared grey grid.

## What we ship today (v1)

| Piece | Reality |
|-------|---------|
| Topology | 20 km **flat disk** + decorative ring mesh |
| Districts | 14 homage zones on a circle (`earth-planet.ts`) |
| Cities | Procedural **boxes** + optional Kenney GLBs |
| Flight | 6DOF with **no gravity**; default was cruise thrust → felt like floating |
| Per character | Same world; hero picks `districtId` spawn only |

v1 is a **flight combat sandbox**, not globe exploration.

## Target experience (v2)

1. **Spherical planet** — fly around curvature; altitude = distance from center; horizon shifts.
2. **District = city biome** — Gotham, Metropolis, etc. each have distinct skyline **prefabs** (CC0 kits), not one shared hash grid.
3. **Hero home** — landing at **your** city when you pick a character (fast travel between cities on the globe).
4. **Controls** — hold **W / RT** to thrust; idle hover without mystery drift (shipped fix in `game-input.ts`).
5. **Exploration** — surface landmarks + orbit band; minimap as small globe or equirectangular strip.

## Phased build (do not skip Phase 0)

| Phase | Deliverable | Risk |
|-------|-------------|------|
| **0** | Idle throttle + control overlay + deploy latest to vantagegames1 | Low — **now** |
| **1** | Per-district city **layouts** (14 seeds) on flat disk — still readable cities | Medium |
| **2** | **Sphere coordinates** — spawn on shell, tangent flight near surface | High — refactors `districtIdAtPosition`, orbit, shatter |
| **3** | Streaming chunks + Kiln CC0 city packs per district | High |
| **4** | Hero-exclusive hubs (only if roster gets unique districts) | Scope |

God’s Eye (`gods-eye/`, Cesium) is a **separate** real-Earth globe for Iris — not the game client. Battleworld globe stays **PlayCanvas** in `flight-nemulator/`.

## City Nights parallel

Same product issue: **blocks + invisible roads**. Fixes in `build-openworld-maze` (maze off estate), `build-city-streets` (starter corridor + brighter decks). **Visual tier 1–2** CC0 install still required for “not blocks” on cars/buildings (`npm run gamedev-resources` / Kiln).

## Success = boys say

- City Nights: “I drove out of the garage onto a real road.”
- Battleworld: “I chose a hero and flew **to** a city, not through grey towers.”

Until Phase 2 lands, market Battleworld as **arcade flight on homage cities**, not globe sim.