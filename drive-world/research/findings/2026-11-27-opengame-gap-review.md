# OpenGame gap review — City Nights focus

Canonical: [`docs/OPENGAME_VANTAGEGAMES_REVIEW.md`](../../../docs/OPENGAME_VANTAGEGAMES_REVIEW.md)

## Useful OpenGame files we actually opened

- `skills/openmotion-game/SKILL.md` — validate → simulate → playtest → P2 reporting
- `templates/games/neon-drift/` — rain highway, near-miss boost loop
- `templates/games/tidebreaker/DESIGN.md` + `verify-offline.cjs` — 115 assertions without Chrome
- `templates/games/skyline-courier/DESIGN.md` — timed delivery mission structure

## Top 3 code slices to pull next (City Nights)

1. **CN-OG-02** Near-miss boost (Neon Drift mechanic) — `game-heat.ts` + scoring toast
2. **CN-OG-03** `runSelfTests()` — 3 invariants in `playtest` hook
3. **CN-OG-05** Vitest on `landmark-sprint-board.ts` + `bay-navigation` pure helpers

## Not importing

OpenGame MCP server, paid multimodal generation, template source copy into `drive-world/`.