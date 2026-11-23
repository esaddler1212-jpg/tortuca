---
name: game-finish
description: Work a VantageGames day slice (City Nights or Battleworld) and report to Iris via game-finish-status.json.
---

1. Read `docs/GAME_FINISH_PROGRAM.md` and `shared/game-finish-status.json` for the active slice.
2. **Nightshift** only touches `drive-world/`. **Skyring** only touches `flight-nemulator/` (and shared only if required).
3. Implement one slice; run the slice `verify` command from the program table.
4. `npm run game-finish:report -- --agent nightshift|skyring --slice <id> --status done --summary "one sentence for Iris"`
5. Commit code + `shared/game-finish-status.json`; open PR. Alfred Team tab shows the report after deploy.
