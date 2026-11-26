---
name: tortuca-perf-profile
description: Browser perf pass for City Nights (Bay quality) or Battleworld graphics tier.
---

**City Nights**

1. Settings → Bay quality: test **Chromebook**, **Balanced**, **Lush / Console TV**.
2. Note traffic, coastal weather, fuel toggles; measure hitch near Vallejo hub (streaming).
3. Check freeway lamp cap in `build-world.ts` / audit doc; avoid new per-frame allocations in `game-loop.ts`.
4. Document in findings: fps feel, draw-call concerns, recommended default for boys console.

**Battleworld**

1. Graphics quality Medium/High; orbit rim once; note quality probe outcome.
2. Kenney/worldgacha optional installs — do not commit gitignored GLB blobs.

Never ship secrets or student PII in perf logs.