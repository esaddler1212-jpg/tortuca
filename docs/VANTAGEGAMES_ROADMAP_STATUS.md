# VantageGames roadmap status (post day-10)

Single page for **program %** vs **integration / season-2** work. Update when slices or milestones land.

## Day-10 finish program (canonical)

Source: `shared/game-finish-status.json` + `npm run test:game-finish`

| Track | Slices | Typical status |
|-------|--------|----------------|
| **Overall program** | 24 (`cn-d01…d10`, `cn-s01…s02`, `bw-d01…d10`, `bw-s01…s02`) | **100%** when all `done` |
| **Nightshift** (City Nights) | 12 | **100%** |
| **Skyring** (Battleworld) | 12 | **100%** |

Release gate: `VANTAGEGAME_FINISH_GATE=1 npm run test:game-finish` (requires 100% slices).

## Integration milestones (not in day-10 slice count)

| Milestone | Status |
|-----------|--------|
| Battleworld open-world tier pack merged | **Done** (`docs/BATTLEWORLD.md`) |
| City Nights Tokyo CI / landing HUD | **Done** (`test:tokyo`) |
| City Nights find-next minimap parity | **Done** (`CITY_NIGHTS_OPEN_WORLD_TIERS.md`) |
| Merge integration → `main` (PR #149) | **Done** |
| Production wiring audit | **Done** (`npm run test:vantage-production`) |
| Season-2 slices in `gameFinishProgram.ts` | **Done** |
| Live couch smoke on production Netlify | **Optional** — `docs/BROWSER_VISUAL_DEPLOY.md` after deploy |

**Integration checklist: 6 / 6 automated milestones done.**

## Season-3 backlog (not in program yet)

1. Async ghost sprint leaderboards (Nightshift)
2. Battleworld room-goal live POST dogfood (Skyring)
3. Tokyo heightfield physics OR accept flat slab doc

## Commands

```bash
npm run test:game-finish
npm run test:vantage-production
npm run test:city-nights    # drive-world full gate
npm run test:flight-nemulator
```