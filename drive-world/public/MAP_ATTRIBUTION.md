# Map data attribution

City Nights uses **hand-tuned** freeway waypoints and district rects (`world-config.ts`). Tier 5 optional files under `public/data/osm/` may contain derivatives of [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL).

When you ship OSM-derived JSON or minimap rasters:

1. Credit **© OpenStreetMap contributors** on the settings or map screen.
2. Keep raw extracts in `drive-world/data/` or local-only paths — do not commit proprietary map tiles.
3. Runtime loads **offline** JSON only (`build-osm-landmarks.ts`); no Overpass calls in the browser.

See [`research/findings/2026-11-13-semi-accurate-bay-map.md`](../research/findings/2026-11-13-semi-accurate-bay-map.md) and [`docs/TIER5_SIM_BAY.md`](../../docs/TIER5_SIM_BAY.md).