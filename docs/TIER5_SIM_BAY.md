# Tier 5 — sim-Bay hooks (heavy / optional)

City Nights stays a **compressed night-driving canvas** (`GAME_FINISH_PROGRAM.md`). Tier 5 adds **offline** geodata paths for teams that want OSM fidelity without shipping a full GIS sim.

| Item | Status | Path |
|------|--------|------|
| WGS84 anchor + control tests | **Shipped** | `drive-world/src/geo-anchor.ts`, `scripts/check-geo-anchor.mts` |
| Overpass freeway bake (maintainer) | **Shipped** | `npm run build:bay-freeways` → `drive-world/data/osm-freeways.json` |
| OSM landmark pillars (optional GLB-free markers) | **Shipped** | `build-osm-landmarks.ts`, `public/data/osm/landmarks.example.json` |
| Map attribution | **Shipped** | `drive-world/public/MAP_ATTRIBUTION.md` |
| Optional building facade PBR | **Shipped** | `building-pbr.ts` + `install-free-packs.sh --building-pbr` |
| HUD lat/lng readout (experimental) | **Shipped** | `experimentalGeoHud` in settings |
| Full OSM road mesh in PlayCanvas | **Deferred** | Perf + ODbL + night-palette conflict |
| Photoreal lat/lng driving physics | **Out of scope** | Use anchor for HUD/share only |
| Embedded asset marketplaces in PWA | **Docs only** | [`GAMEDEV_MARKETPLACES.md`](./GAMEDEV_MARKETPLACES.md) |

Parent checklist: [`VISUAL_UPGRADE_TIERS.md`](./VISUAL_UPGRADE_TIERS.md).