# Battleworld — verification (OpenGame-style)

Living checklist for **Hard Fails** (P0), experience (P1), and **Known gaps P2** (max 5 in family reports). Gate: `npm run test:battleworld-complete` + `npm run test:playtest` in `flight-nemulator`.

## Hard Fails (must never ship broken)

| ID | Invariant | Check |
|----|-----------|-------|
| HF-BW-01 | Tap start → hero HUD live | `flight-nemulator` `test:playtest` |
| HF-BW-02 | Campaign chapter chip + objective (1–6) | playtest + `check-battleworld-chapters` |
| HF-BW-03 | Bundled hero + nemesis GLBs on disk | `test:battleworld-complete` |
| HF-BW-04 | Offline bundle (`VITE_BATTLEWORLD_OFFLINE_BUNDLE`) on vantagegames1 | `smoke:vantagegames1` |
| HF-BW-05 | `runSelfTests()` invariants | playtest first line |

## P1 experience

- Chapter chain visible at 1280×720 and **390×844** (console couch + phone)
- Home **H** on minimap + arc objective chip on boot
- Hero flight responds to WASD; boost (Shift) without WebGL fault
- Autosave hint readable on vantagegames1 offline build

## Known gaps P2

1. **BW-OG-02 burst** — playtest captures boost HUD frames (`PLAYTEST_BURST=1`)
2. Wave-10 pair duel scripted smoke (no fast-forward cheat yet)
3. Emissive cap visual pass (nemesis clarity)
4. games-hub tile metadata like OpenGame `game.json`
5. Live lattice optional — offline-first on vantagegames1 is canonical

## Evidence

Burst frames: `PLAYTEST_BURST=1 PLAYTEST_SHOTS=/opt/cursor/artifacts npm run test:playtest` (flight-nemulator).

_Last reviewed: 2026-11-27 (A+B+C audit pass)._  