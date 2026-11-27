# Battleworld — complete (family / couch)

Battleworld is **complete** when this doc’s gate passes and [`npm run test:flight-nemulator`](../package.json) is green (includes **`BATTLEWORLD_COMPLETE_GATE=1`**).

OpenGame-style checklist: [`BATTLEWORLD_VERIFICATION.md`](./BATTLEWORLD_VERIFICATION.md). Family URL smoke: [`COUCH_SMOKE_VANTAGEGAMES1.md`](./COUCH_SMOKE_VANTAGEGAMES1.md).

## Shipped in the completion pass

| Area | What |
|------|------|
| **Campaign** | Chapters **1–6** on HUD (intro → fate); opening objective follows full ladder |
| **Hero GLBs** | **11** bundled roster pilots (`hero-gltf-paths`, `npm run build:hero-glb`) |
| **Nemesis GLBs** | **5** wave-10 pair meshes (`villain-gltf-paths`, `npm run build:nemesis-glb`) |
| **Open world** | Room goal, almanac, seasons, find-next, invite shard, district ★, photo |
| **Cloud** | Lattice + room goal routes (optional session on Tortuca; offline on vantagegames1) |
| **Manifest** | `manifest-updates.json` v3 + offline fetch in `updates.ts` |

## Explicitly out of scope

- Real-time multiplayer (local room goal tally only)
- Blockbench mesh for **every** roster id (procedural fallback remains)
- X-Men tier B+ full drop (research docs only)

## Gate

```bash
BATTLEWORLD_COMPLETE_GATE=1 npm run test:flight-nemulator
# or
cd flight-nemulator && npm run build:glb && npx tsx ../scripts/check-battleworld-completion.mts
```

## 15-minute “done” funnel

Uses [`BATTLEWORLD_CONSOLE_FEEL.md`](./BATTLEWORLD_CONSOLE_FEEL.md) with campaign chip showing **6** chapters. Finish when **Ch.6** ticks or player saves the world.

## Cursor / Skyring

Report with:

```bash
npm run game-finish:report -- --agent skyring --slice bw-s02 --status done --summary "Battleworld completion gate: GLBs + campaign 1-6"
```

(Iris reads finish program slices; completion is this doc + `check-battleworld-completion`.)