---
name: tortuca-gate-check
description: Pre-merge gate for VantageGames completion slices.
---

1. Read `docs/CITY_NIGHTS_COMPLETE.md` or `docs/BATTLEWORLD_COMPLETE.md` for the game you changed.
2. Run the named npm script (`test:city-nights-complete` or `test:battleworld-complete`).
3. For Iris/netlify changes, ensure `npm run test:vantage-production` still passes.
4. Update `shared/game-finish-status.json` only via `npm run game-finish:report` when a program slice truly finished.
5. Do **not** mark multiplayer or paid art in scope unless owner direction docs say so.