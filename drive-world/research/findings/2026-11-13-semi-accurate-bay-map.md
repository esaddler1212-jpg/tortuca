# Semi-accurate Bay Area maps in City Nights

**Goal:** Players recognize I-80 vs 880 vs 101 placement and major hubs (SFO, Oakland, Golden Gate, San José) without shipping a full GIS sim or real road geometry in PlayCanvas.

**Current stack (already semi-accurate):**

| Piece | File | What it does |
|-------|------|----------------|
| World axes | `world-config.ts` | `+X` east, `+Z` north, `WORLD_HALF_M = 2600` compressed canvas |
| Freeways | `FREEWAY_*` waypoints | Hand-tuned polylines; comments cite Caltrans / regional topology |
| Districts | `DISTRICTS` | Rectangular regions (SF, Marin, East Bay, …) |
| Landmarks | `landmark-registry.ts` | Named pins at `(x, z)` |
| Hubs | `city-map-registry.ts` | Neighborhood “full map” radii around landmarks |
| HUD | `hud/BayMap.tsx` | SVG minimap: districts, freeways, player, nav route |
| World mesh | `build-bay-ground.ts` | Heightmapped fill; streets/freeways drive gameplay |

There is **no** WGS84 lat/lng in the runtime today — everything is game meters.

---

## What “semi-accurate” should mean for VantageGames

1. **Relative placement:** Freeway crossings and bridge approaches feel like the real Bay (water on the west, East Bay east of the estuary, peninsula south).
2. **Named truth:** Landmark labels and district names match real geography at ~city-block scale, not sub-meter GPS.
3. **Nav honesty:** GPS-style routing in `bay-navigation.ts` follows the same graph players see on the minimap (freeway graph + street registry).
4. **Acceptable error:** ±5–15% scale compression and straightened ramps are fine; wrong county is not.

Avoid: embedding Mapbox tiles in the 3D world (licensing, z-fighting, mobile bandwidth). Prefer **HUD underlay** or **offline vector bake** into existing waypoint format.

---

## Recommended pipeline (phased)

### Phase A — Georeference anchor (1 module, no live API)

Pick a fixed anchor in WGS84 and a 2D affine map `gameX, gameZ = f(lon, lat)`:

- Anchor suggestion: **Ferry Building** or **downtown SF** ≈ `(-122.39, 37.79)`.
- Fit with 3–4 control points (GG Bridge north anchor, SFO, downtown Oakland, San José Diridon) using least squares.
- Store in `drive-world/src/geo-anchor.ts`:
  - `wgs84ToGame(lon, lat) → { x, z }`
  - `gameToWgs84(x, z) → { lon, lat }` (for HUD / share links only)

**Validation:** Unit test that known landmarks are within ~2 km of their real bearing from anchor (not distance-perfect).

### Phase B — Freeway ingest (offline build script)

1. Query [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) once per release (not at runtime):

   ```text
   [out:json];
   way["highway"~"motorway|trunk"](37.25,-122.55,38.05,-121.75);
   out geom;
   ```

2. Filter to refs: `I 80`, `I 880`, `US 101`, `I 280`, `I 580`, `I 680`, `CA 24`, etc.
3. Simplify polylines (Ramer–Douglas–Peucker, ε ≈ 50–80 m in WGS84).
4. Transform each vertex with `wgs84ToGame`, quantize to integers, emit TypeScript or JSON consumed by `world-config.ts` / a `freeway-graph.json`.

**Human pass:** Merge with existing hand-tuned `y` elevations at bridges (`y` on waypoints) — OSM does not give deck height.

### Phase C — Landmark sync

- Maintain `landmarks.csv` with `id, name, lon, lat` (OSM node or Wikipedia coords).
- Build script writes `landmark-registry.ts` positions via anchor transform.
- Keep gameplay-only landmarks (ghost gates, nitro zones) as manual offsets from nearest real pin.

### Phase D — HUD “map underlay” (optional, high recognition)

- Pre-render a **static** 512–1024px WebP of OSM / Apple Map style (**check license** — OSM ODbL requires attribution; no proprietary tiles in repo without license).
- Or: faint SVG shoreline + bay fill from public [Natural Earth](https://www.naturalearthdata.com/) simplified coast (public domain).
- Draw in `BayMap.tsx` **behind** freeway lines already coded — do not sync 3D mesh to raster.

### Phase E — Craft / browser research loop

Per `docs/CITY_NIGHTS_CRAFT_ANYTHING.md`:

- Side-by-side capture: Google Maps Bay Area vs City Nights minimap at same nominal zoom.
- Score: “Can you name the freeway under the player?” (qualitative checklist in journal).

---

## What not to do (yet)

| Idea | Risk |
|------|------|
| Live Overpass in the PWA | Rate limits, latency, ToS |
| Full OSM road driving mesh | Physics + draw calls; fights procedural blocks |
| Lat/lng in save / multiplayer | Cheaper to keep game-space only |
| Sub-meter building footprints | Art scope; hubs already abstract blocks |

---

## Tie-in to finish program

| Slice | Map work |
|-------|----------|
| `cn-d04` | Ghost circuits aligned to freeway waypoints (done intent) |
| `cn-d06` | Perf after any new minimap layers |
| `cn-d10` | Funnel copy references recognizableBay landmarks |
| **Season 2** | `cn-map-01` script: `npm run build:bay-freeways` from Overpass + geo anchor |

---

## Minimal next PR (suggested)

1. Add `geo-anchor.ts` + 4-point fit + test.
2. Add `scripts/build-bay-freeways.mts` (optional env `OVERPASS_URL`, cached `drive-world/data/osm-freeways.json` committed).
3. Document attribution in `drive-world/public/MAP_ATTRIBUTION.md` if OSM derivatives ship.

No change to Battleworld — earth scale is fictional lattice; only City Nights needs Bay fidelity.
