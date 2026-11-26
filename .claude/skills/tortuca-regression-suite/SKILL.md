---
name: tortuca-regression-suite
description: Full Tortuca regression before PR or deploy preview.
---

1. From repo root: `npm run test:guardrails` then `npm run test:thin`.
2. Run `npm run test:os` (build, Iris, research, flight-nemulator, game-finish, vantage-production wiring).
3. If you touched only `drive-world/`, still run `npm run test:city-nights-complete`.
4. If you touched only `flight-nemulator/`, still run `npm run test:battleworld-complete`.
5. Never weaken `AGENTS.md` session gates, `safeFact`, or Netlify secrets checks to green tests.
6. Commit only when the suite you ran is green; cite commands in PR body.