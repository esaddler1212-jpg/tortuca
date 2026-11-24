# Free 3D building assets (research)

Curated options that fit Tortuca’s **browser GLB + optional local install** pattern (no giant binaries in git). Single source for agents: pair with [`GAMEDEV_RESOURCES.md`](./GAMEDEV_RESOURCES.md) and [`shared/art-district-manifest.json`](../shared/art-district-manifest.json).

## Already wired in repo

| Source | License | Install | Runtime |
|--------|---------|---------|---------|
| [Kenney City Kit (Commercial)](https://kenney.nl/assets/city-kit-commercial) | CC0 | `bash tools/gamedev-resources/install-free-packs.sh --city-glb` | `kenney-city/index.json` → `placeKenneySlots` / `placeDistrictKenneySkyline` |
| [Kenney Car Kit](https://kenney.nl/assets/car-kit) | CC0 | committed under `drive-world/public/models/kenney/` | vehicles |
| Blockbench hero exports | CC0 (ours) | `flight-nemulator npm run build:hero-glb` | `hero-gltf.ts` |
| Oyasumi World Gacha | Tool terms (no pack redistribution) | [`WORLDGACHA_WORKFLOW.md`](./WORLDGACHA_WORKFLOW.md) | `placeWorldGachaTowns` |

## Recommended adds (CC0 / public domain)

| Pack | Why | Links | Tortuca use |
|------|-----|-------|-------------|
| **Kenney Modular Buildings** (2024 remake) | ~100 modular walls/roofs; **GLB** in zip; matches low-poly Bay read | [OpenGameArt](https://opengameart.org/content/modular-buildings), [Kenney itch](https://kenney-assets.itch.io/modular-buildings) | `install-free-packs.sh --modular-glb` → `models/kenney-modular/` (optional skyline filler) |
| **Kenney City Kit** on Poly Pizza | Same CC0 commercial buildings as our sparse clone | [Poly Pizza bundle](https://poly.pizza/bundle/City-Kit-0CkvGrBJ0u) | Manual grab if GitHub sparse clone fails |
| **City Builder Bits** (Kay Lousberg) | 32+ GLTF buildings, single atlas | [Poly Pizza](https://poly.pizza/bundle/City-Builder-Bits-1wLdnIddSx) | CC0 — good for **one-off hero landmarks**; credit optional |
| **Poly Haven** | CC0 HDRIs + models | [polyhaven.com](https://polyhaven.com) | Sky (already), future **pier/warehouse** props |
| **AmbientCG** | CC0 PBR materials | [ambientcg.com](https://ambientcg.com) | Asphalt/concrete on street decks (City Nights) |

## Browse-only (check license per asset)

| Source | Note |
|--------|------|
| [Poly Pizza](https://poly.pizza) | Many CC0; filter license before `install` whitelist |
| [Sketchfab** download with CC](https://sketchfab.com) | Per-model; avoid NC or “editor only” |
| [OpenGameArt](https://opengameart.org) | Always read license block on the page |
| [3DTexel API](https://3dtexel.com) | Research / texture hits in Flight Nemulator HUD — not auto-import |

## Do not bulk-commit

- **Kavex GameSounds** (GPL-3.0) — link only ([`GAMEDEV_RESOURCES.md`](./GAMEDEV_RESOURCES.md)).
- Anything without explicit CC0/CC-BY with attribution plan → keep out of `public/` until `CREDITS.md` line exists.

## Workflow for new art slices

1. Pick anchor from `shared/art-district-manifest.json` (landmark id + `x,z`).
2. Add procedural kit: collision deck at `streetDeckY` (City Nights) or emissive beacon (Battleworld).
3. Add Kenney slots (same `KenneySlot` schema); run `install-free-packs.sh --city-glb` locally.
4. `npm run test:vallejo-art` or `test:battleworld-art`; screenshot; update art brief.