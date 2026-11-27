# City Nights — complete (family / couch)

City Nights is **complete** when this doc’s gate passes and [`npm run test:city-nights-complete`](../package.json) is green.

## Shipped scope

| Area | What |
|------|------|
| **Loop** | Waymo → starter → regions → taco + landmarks → Tokyo 8/8 FF fleet |
| **Open world** | Find-next pin, photo mode, chapters, street rep, heat, 3 ghost sprints + **local top-3** boards |
| **Console** | Pause, gamepad, frame cap — `docs/CITY_NIGHTS_CONSOLE_FEEL.md` |
| **Music** | CC0 beds in `public/music/playlist.json` |
| **QA** | `test:city-nights` (wiring, smoke, playtest, Tokyo) + this completion gate |

## Out of scope

- Live multiplayer (local ghost boards only)
- Photoreal city mesh / EarthNG import
- Full CPM2 tuning garage

## Gate

```bash
npm run test:city-nights-complete
# full drive-world suite:
cd drive-world && npm run test:city-nights
```

## P2 done in completion pass

- Oracle Park / Chase Center beacon separation (registry + meshes)
- `prefers-reduced-motion` hides minimap vista pulse ring
- Sprint leaderboard field + static check

## Verification (OpenGame-style)

Hard Fails + P2 list: [`CITY_NIGHTS_VERIFICATION.md`](./CITY_NIGHTS_VERIFICATION.md)  
OpenGame gap review: [`OPENGAME_VANTAGEGAMES_REVIEW.md`](./OPENGAME_VANTAGEGAMES_REVIEW.md)