# City Nights — verification (OpenGame-style)

Living checklist for **Hard Fails** (P0), experience (P1), and **Known gaps P2** (max 5 in user-facing reports). Gate: `npm run test:city-nights-complete`.

## Hard Fails (must never ship broken)

| ID | Invariant | Check |
|----|-----------|-------|
| HF-01 | Boot without TypeError; Waymo skippable | `npm run test:smoke` |
| HF-02 | Save/load v9 round-trip | `test:wiring` + manual import |
| HF-03 | Tokyo gate 8/8 FF fleet wiring | `npm run test:tokyo` |
| HF-04 | Chase cam does not collapse to ~2.8 m | `npm run test:playtest` |
| HF-05 | Session progress persists after sprint PB | `test:landmark-sprint-board` |

## P1 experience (fix before calling “couch done”)

- Chapter 1 pin visible at Vallejo cold start
- Map tab find-next pin when mission active
- Gamepad RT/LT throttle on Console preset
- Heat hunted state readable at 1280×720 and **390×844**

## Known gaps P2 (OpenGame cap: list ≤ 5 to family)

1. Procedural city blocks (no Kenney district pack on deploy machine)
2. Near-miss boost + `runSelfTests` — **CN-OG-02 / 03 shipped**
3. `game-loop.ts` monolith — split deferred
4. Light police pursuit above heat 4 — design only
5. Trustfund third game — spec only

## Evidence

Store playtest screenshots under `/opt/cursor/artifacts/` or `drive-world/research/findings/*-couch-*.md`.

_Last reviewed: 2026-11-27 (OpenGame gap pass)._