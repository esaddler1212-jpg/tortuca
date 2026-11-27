# OpenGame review of VantageGames (City Nights + Battleworld)

**Reviewer lens:** OpenGame `openmotion-game` workflow ([`game-gates.md`](https://github.com/nexu-io/opengame/blob/main/skills/openmotion-game/references/game-gates.md), [`game-feel-craft.md`](https://github.com/nexu-io/opengame/blob/main/skills/openmotion-game/references/game-feel-craft.md)) applied to Tortuca’s **family-complete** gates, not AAA template parity.

**Upstream clone:** `npm run opengame:bootstrap` → `tools/opengame/upstream/`

---

## Executive verdict

| Game | OpenGame “Full Track” fit | Our status | OpenGame would still ask for |
|------|---------------------------|------------|----------------------------|
| **City Nights** | `realtime-3d` + `skill-flow` / `sandbox-explore` | **Playable & gated** (`CITY_NIGHTS_COMPLETE`) | P2 doc, portrait HUD pass, near-miss loop, Vitest harness |
| **Battleworld** | `realtime-3d` + `skill-flow` | **Playable & gated** (`BATTLEWORLD_COMPLETE`) | `runSelfTests`, burst playtest frames, GLB clarity pass |
| **Console shell** | N/A (launcher) | vantagegames1 | Cover cards + control strings like `game.json` metadata |

We are **ahead** of OpenGame mini-games on: region scale, save migration, second map (Tokyo), chapter ladders, finish program, Iris guardrails.

We are **behind** OpenGame studio on: per-project `verification.md` with **Hard Fails**, automated **invariant self-tests** in browser, **simulate** for pure logic, and **remix/publish** one-click pipeline (intentionally out of scope).

---

## City Nights — gap fill (prioritized)

| ID | Gap (OpenGame signal) | Peer template | Owner | Effort |
|----|------------------------|---------------|-------|--------|
| CN-OG-01 | No `design/verification.md` with 3–5 Hard Fails + P2 list | All templates use DESIGN/verify | Gatekeeper | **Done doc:** `CITY_NIGHTS_VERIFICATION.md` |
| CN-OG-02 | No **near-miss chain** scoring (boost refill) | `neon-drift` | Nightshift | Medium — gameplay |
| CN-OG-03 | No `window.__* runSelfTests()` for playtest | `game-gates.md` | Nightshift | Small — hook + 3 checks |
| CN-OG-04 | Portrait **390×844** not in automated playtest | `game-feel-craft.md` | Gatekeeper | Small — smoke config |
| CN-OG-05 | Pure-module **offline verify** (no Chrome) | `tidebreaker/verify-offline.cjs` | Nightshift | Medium — Vitest |
| CN-OG-06 | Traffic density as **config levers** exposed to player | `neon-drift` traffic | Nightshift | Small — settings doc |
| CN-OG-07 | **Cover / key art** 1280×720 capture ritual | `capture_cover` | Kiln | Small — use photo mode + artifact path |

Already strong vs OpenGame: tabbed HUD, ghost sprints + local boards, find-next pin, playlist BGM, console-feel, CI smoke.

---

## Battleworld — gap fill

| ID | Gap | Owner | Effort |
|----|-----|-------|--------|
| BW-OG-01 | `runSelfTests` (kinematics, HUD overlay, chapter state) | Skyring | Small |
| BW-OG-02 | Playtest **burst** frames on wave-10 / super | Skyring | Small |
| BW-OG-03 | `design/verification.md` mirror | Gatekeeper | **Doc** — extend `BATTLEWORLD_COMPLETE.md` |
| BW-OG-04 | Visual clarity pass (emissive cap 2–3) | Kiln | Medium — art brief |
| BW-OG-05 | Metadata block like `game.json` on console tile | Lattice | Small — games-hub |

---

## Studio / agents — what OpenGame adds to Tortuca stack

| Toolchain | Role |
|-----------|------|
| **OpenGame** (`openmotion-game`) | Brief → validate → playtest → P2 reporting; remix templates |
| **Game Studios** (Donchitos) | `/smoke-check`, regression narrative |
| **awesome-gamedev-agent-skills** | GLB / three.js craft |
| **Tortuca `.claude/skills/tortuca-*`** | Mapped npm gates |

Recommended **not** to merge: OpenGame MCP into Alfred Netlify (attack surface + cost model).

---

## Next sprint (suggested, no code required this pass)

1. **Nightshift:** CN-OG-02 spec in `drive-world/research/findings/` (near-miss meter stub)
2. **Gatekeeper:** Run couch pass with CN-OG-04 portrait checklist
3. **Skyring:** BW-OG-01 self-test hook in `playtest-battleworld.mjs`
4. **Woodhouse:** Optional `npx skills add` OpenGame on dev laptop only

## Commands

```bash
npm run opengame:bootstrap
npm run test:city-nights-complete
npm run test:battleworld-complete
```