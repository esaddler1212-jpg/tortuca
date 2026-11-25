# City Nights open-world parity (World Craft / peer tiers)

Battleworld shipped the full A/B/C tier pack in [`BATTLEWORLD.md`](./BATTLEWORLD.md). City Nights already covers most **Bay** peers; this doc tracks what maps 1:1 vs Battleworld-only.

| Tier | Battleworld | City Nights (drive-world) |
|------|-------------|---------------------------|
| A | Room goal + cloud tally | — (async rep / ghosts are local+blob future) |
| A | Lattice almanac | **Journal** + landmark/taco/scenic logs (`cruise-journal.ts`) |
| A | World Gacha rise spawn | — (Bay uses authored hubs / Kenney kits) |
| A | Auto quality probe | **`bayQualityPreset`** + hub streaming (`bay-quality.ts`) |
| A | Guest cloud hint | Progress via local save + optional cloud (`game-cloud-save.ts`) |
| B | District 3★ challenge | **Parking stars** + drift pads + CPM PBs |
| B | Photo postcard | **Photo mode** P + orbit (`photo-mode.ts`) |
| B | **Find next** gold pin | **`nextLandmark`** + route line + **gold minimap pin** (`BayMap.tsx`) |
| C | Invite shard `?bwShard=` | — (share photo card / deep links future) |
| C | Daily mission + season | **Mission steps** + chapter pins (`mission-nav.ts`) |
| — | Tokyo FF bonus map | **Shipped** — `test:tokyo` |

## Tests

- `npm run test:city-nights` — wiring + smoke + playtest + Tokyo
- `node scripts/check-city-nights-openworld-parity.mts` — static parity audit (repo root)

## Season-2 backlog (optional)

- Async blob leaderboard per ghost sprint id (peer: CPM2 boards)
- Share / invite deep link for couch co-pilot saves
- Heightfield physics on Tokyo visuals (flat slab + `tokyoGroundHeightM` today)