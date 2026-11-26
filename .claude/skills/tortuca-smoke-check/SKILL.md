---
name: tortuca-smoke-check
description: Run City Nights or Battleworld smoke/playtest before hand-off; save evidence.
---

1. Identify game: **City Nights** (`drive-world/`) or **Battleworld** (`flight-nemulator/`).
2. **City Nights:** `cd drive-world && npm run test:smoke` then `npm run test:playtest` if Chrome is available; otherwise smoke only and note gap.
3. **Battleworld:** `cd flight-nemulator && npm run test:smoke` and `npm run test:playtest`.
4. On failure: fix boot/runtime errors first; do not mark slice done.
5. Save screenshot or short log under `/opt/cursor/artifacts/` or `drive-world/research/findings/YYYY-MM-DD-smoke.md`.
6. Optional full gate: `npm run test:city-nights-complete` or `npm run test:battleworld-complete` from repo root.