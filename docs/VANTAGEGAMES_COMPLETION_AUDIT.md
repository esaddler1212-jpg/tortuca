# VantageGames completion audit (family / couch “entirety”)

**Audience:** family boys on **vantagegames1** · **CC0-only** art · **local-only** competition · finish-program **24/24 done**.  
**Method:** Tortuca docs + `gamedev-skills` router discipline (`prototype-fast`, `create-game-assets`, `threejs-gltf-loading`) — see [`tools/awesome-gamedev-agent-skills/CHERRY_PICK.md`](../tools/awesome-gamedev-agent-skills/CHERRY_PICK.md).

## Executive summary

| Game | Shippable for family couch | vs “full” peer open-world / crossover vision | Automated gate |
|------|----------------------------|-----------------------------------------------|----------------|
| **City Nights** | **~88%** | **~62%** (no MP, sparse traffic, box city art) | `cd drive-world && npm run test:city-nights` |
| **Battleworld** | **100%** ([`BATTLEWORLD_COMPLETE.md`](./BATTLEWORLD_COMPLETE.md)) | **~70%** vs full roster Blockbench (MP out of scope) | `npm run test:battleworld-complete` |
| **Trustfund** | **0%** (spec only) | N/A | `*-trustfund-mvp.md` |

“Entirety” here means: **complete festival-style slice** on web (play loop, save, console feel, second map, open-world UX, CI) — not parity with CPM2 multiplayer or FH seasons.

---

## City Nights — done vs remaining

### Shipped (complete for v1 scope)

- Waymo → starter → regions → Tokyo 8/8 FF fleet, chapters, street rep, heat, nitro FOV, ghost sprints (3 circuits), find-next pin, photo mode, tabbed HUD, hub streaming, CI (`test:tokyo`, playtest, smoke).
- Source: [`CITY_NIGHTS_AUDIT.md`](./CITY_NIGHTS_AUDIT.md) passes 2–4, [`CITY_NIGHTS_OPEN_WORLD_TIERS.md`](./CITY_NIGHTS_OPEN_WORLD_TIERS.md).

### P2 — polish to “entirety” (browser-safe)

| ID | Item | Owner | Verify | Upstream skill hint |
|----|------|-------|--------|---------------------|
| CN-P2-01 | Oracle Park / Chase Center overlap (~12 m) | Nightshift | Manual + map coords | — |
| CN-P2-02 | `public/music/` CC0 night loop set | Mixdown | Playlist non-empty in smoke | — |
| CN-P2-03 | `aria` / reduced-motion for vista pulse | Nightshift | a11y spot in console-feel doc | `prototype-fast` scope |
| CN-P2-04 | Vitest on pure modules (`bay-navigation`, saves) | Gatekeeper | `drive-world` test script | Game Studios `/regression-suite` |
| CN-P2-05 | `game-loop.ts` split (future features) | Nightshift | no behavior change; plan in findings | `game-docs` minimal |

### P3 — peer gaps (optional / local-only)

| ID | Item | Owner | Verify |
|----|------|-------|--------|
| CN-P3-01 | **Local sprint top-3 board** per ghost circuit | Nightshift | `scripts/check-landmark-sprint-board.mts` |
| CN-P3-02 | Freeway traffic density tuning | Nightshift | quality preset notes |
| CN-P3-03 | Handling presets per car (not full CPM tuning) | Nightshift | design in peer doc |
| CN-P3-04 | Trustfund third title spec | Nightshift | `*-trustfund-mvp.md` |

### Visual tiers ([`VISUAL_UPGRADE_TIERS.md`](./VISUAL_UPGRADE_TIERS.md))

| Tier | Status | Owner |
|------|--------|-------|
| 0–1 | Wired in code | Kiln: run `--hero-minis` / `--city-glb` on deploy machine |
| 2–4 | Partial / install optional | Kiln: findings `*-cc0-vantagegames1.md` |
| 5 | Building PBR | Deferred unless CC0 pack lands |

---

## Battleworld — done vs remaining

### Shipped (v1 Battleworld)

- District ring, combat, arcs, chapters, stones, pair bosses, autosave, offline bundle on vantagegames1, open-world tier pack (room goal local + API, almanac, find-next, photo, seasons, guest hints).
- Source: [`FLIGHT_NEMULATOR.md`](./FLIGHT_NEMULATOR.md) shipped table, [`BATTLEWORLD.md`](./BATTLEWORLD.md).

### v2 backlog

| ID | Status |
|----|--------|
| BW-V2-01 Hero GLBs (11) + nemesis (5) | **Done** — `npm run build:glb` |
| BW-V2-02 Campaign HUD 1–6 | **Done** |
| BW-V2-03 Completion gate | **Done** — `test:battleworld-complete` |
| BW-V2-04 Live room-goal on alfred2 | Optional deploy smoke |
| BW-V2-05 Multiplayer | **Out of scope** |

---

## Studio task queue (git)

Active board: `shared/game-studio-tasks.json`. After this audit, **Nightshift** also owns **CN-P3-01** (leaderboards) and **Trustfund spec**; **Kiln** owns CC0 hero/minis install per owner direction.

Paperclip: copy issues from `tools/paperclip/completion-audit-issues.md`.

## Commands

```bash
npm run gamedev-skills:bootstrap
npm run test:game-studio-tasks
npm run test:city-nights    # from drive-world
npm run test:flight-nemulator
```