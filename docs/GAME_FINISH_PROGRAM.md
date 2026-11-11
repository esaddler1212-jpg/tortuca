# VantageGames finish program — day slices

Running checklist to take **City Nights** and **Battleworld** from skeleton → shippable. One primary slice per game per day (you can run both the same day if energy allows).

**Iris:** After each slice, agents update [`shared/game-finish-status.json`](../shared/game-finish-status.json). Alfred’s Team tab and Iris “Right now” include **Nightshift** and **Skyring** reports (game studio → Woodhouse → Iris → you).

## Agents (not HUD specialists)

| Call sign | Game | Path | When to use |
|-----------|------|------|-------------|
| **Nightshift** | City Nights | `drive-world/` | driving, progression, perf, audio, console feel |
| **Skyring** | Battleworld | `flight-nemulator/` | flight combat, arcs, GLBs, chapters, HUD |

Cloud/Cursor agents: read [`AGENTS.md`](../AGENTS.md) → *Game finish program*. Use branch `cursor/<slice-id>-b076` when possible.

### Log a completed slice

```bash
npm run game-finish:report -- --agent nightshift --slice cn-d01 --status done --summary "Street rep meter + save"
```

Commit `shared/game-finish-status.json` with the code PR.

### Ask Iris

Examples (after Alfred deploy includes status):

- “What’s Nightshift working on?”
- “How far along are the VantageGames slices?”
- “What did Skyring finish last?”

---

## 15-minute funnel (fill in once)

| Game | Minute 0–5 | Minute 5–15 | Come back tomorrow because… |
|------|------------|-------------|------------------------------|
| **City Nights** | *your line* | | |
| **Battleworld** | *your line* | | |

---

## Day-by-day checklist

Mark in git via `game-finish:report` — not checkboxes in this file (single source: `game-finish-status.json`).

### City Nights · Nightshift

| Day | ID | Slice | Verify |
|-----|-----|--------|--------|
| 1 | `cn-d01` | Street rep meter (region % → rank) | HUD + save |
| 2 | `cn-d02` | Ghost sprint 1 + PB toast | Finish line |
| 3 | `cn-d03` | Nitro Zone post-FX + FOV | Lush preset |
| 4 | `cn-d04` | Ghost sprints 2–3 + circuit roster | 3 routes on map |
| 5 | `cn-d05` | Freeway traffic drones | Chromebook OK |
| 6 | `cn-d06` | Perf: draw calls / hub hitch | `test:smoke` |
| 7 | `cn-d07` | Photo orbit + exposure | Clean exit |
| 8 | `cn-d08` | Heat-5 cop box chase | Spawn + escape |
| 9 | `cn-d09` | One playlist / ACE bed | Settings → music |
| 10 | `cn-d10` | 15-min funnel + gamepad QA | Console feel doc |

### Battleworld · Skyring

| Day | ID | Slice | Verify |
|-----|-----|--------|--------|
| 1 | `bw-d01` | District universe rims + sky | Orbit read |
| 2 | `bw-d02` | Hero GLB #2 | `build:hero-glb` |
| 3 | `bw-d03` | Chapters 1–3 chain | Chapter HUD |
| 4 | `bw-d04` | Wave-10 combat juice | Pair boss feel |
| 5 | `bw-d05` | Hero GLB #3 + nemesis GLB #1 | Spawn mesh |
| 6 | `bw-d06` | X-Men tier-A arc beat | `test:flight-nemulator` |
| 7 | `bw-d07` | Offline save on vantagegames1 | No lattice required |
| 8 | `bw-d08` | Dialogue on chapter clear | Dialogue check |
| 9 | `bw-d09` | Minimap + arc chip | Find home **H** |
| 10 | `bw-d10` | 15-min funnel QA | Smoke + manual |

---

## After day 10

- Re-run peer comparison ([`CITY_NIGHTS_PEER_COMPARISON.md`](./CITY_NIGHTS_PEER_COMPARISON.md)) and pick **season 2** slices.
- Add slices in `shared/gameFinishProgram.ts` + reset or extend `game-finish-status.json`.

## Tests

```bash
npm run test:game-finish
```

Included in `npm run test:os` after merge.
