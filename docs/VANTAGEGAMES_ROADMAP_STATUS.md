# VantageGames roadmap status (post day-10)

Single page for **program %** vs **integration / season-2** work. Update when slices or milestones land.

## Day-10 finish program (canonical)

Source: `shared/game-finish-status.json` + `npm run test:game-finish`

| Track | Slices | Typical status |
|-------|--------|----------------|
| **Overall program** | 20 (`cn-d01…d10`, `bw-d01…d10`) | **100%** when all `done` |
| **Nightshift** (City Nights) | 10 | **100%** |
| **Skyring** (Battleworld) | 10 | **100%** |

Release gate: `VANTAGEGAME_FINISH_GATE=1 npm run test:game-finish` (requires 100% slices).

## Integration milestones (not in day-10 slice count)

| Milestone | Status |
|-----------|--------|
| Battleworld open-world tier pack merged | **Done** (`docs/BATTLEWORLD.md`) |
| City Nights Tokyo CI / landing HUD | **Done** (`test:tokyo`) |
| City Nights find-next minimap parity | **Done** (`CITY_NIGHTS_OPEN_WORLD_TIERS.md`) |
| Merge `cursor/summer-engine-templates-b076` → `main` | Track in git / Netlify deploy |
| Production smoke: room goal API + signed lattice | **Manual** after Tortuca deploy |
| Season-2 slices defined in `gameFinishProgram.ts` | **Pending** product pass |

## Season-2 (suggested, not yet in `GAME_FINISH_SLICES`)

1. Async ghost sprint leaderboards (Nightshift)
2. Battleworld room-goal production dogfood (Skyring)
3. Tokyo heightfield physics OR accept flat slab doc
4. Peer comparison refresh (`CITY_NIGHTS_PEER_COMPARISON.md`)

## Commands

```bash
npm run test:game-finish
npm run test:city-nights    # drive-world full gate
npm run test:flight-nemulator
node scripts/check-city-nights-openworld-parity.mts
node scripts/check-battleworld-openworld-tiers.mts
```