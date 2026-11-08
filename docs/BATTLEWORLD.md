# Battleworld

**Battleworld** is the player-facing name for the Flight Nemulator homage crossover planet (package path `flight-nemulator/` unchanged for deploy).

Marvel, DC, and DBZ **codename** legends share one sky ring: territory raids, Infinity Stone hunts, wave-10 finales, and lattice-linked arcs.

## Quick start

```bash
cd flight-nemulator
npm install
npm run dev
```

**Public deploy (no Alfred):** [Battleworld portal](../boys-student/README.md) — `boys-student/` Netlify site bundles the game.

Console tile (both games): [Tortuca Console](../games-hub/README.md) → **Battleworld**.

## Story ladder (one planet)

1. Territory — villains hold districts; heroes clear the lattice block.
2. Stones — six sites; Thanos / Loki / Ultron homages race the player.
3. Home **H** — corps / ki squad / iron lattice / `home-mark` at home turf.
4. Finalem — hero **pair boss** wave 10, or **villain apex** interceptor for absorb legends.
5. Fate — save ≥52% or villain remake / God Emperor / annihilate.

Progress: `arc-progress.ts` (local) + `pullBattleworldLatticeCloud` on boot (merge) + `POST /api/flight-nemulator-lattice` (Netlify Blobs).

**Production Tortuca:** `BATTLEWORLD_LATTICE_REQUIRE_SESSION=true` (set in root `netlify.toml` production context). Signed-in saves use account-scoped Blobs keys (`X-Alfred-Session` + Google session). Standalone `flight-nemulator/` deploy stays anonymous token sync.

## Docs map

| Doc | Contents |
|-----|----------|
| [FLIGHT_NEMULATOR.md](./FLIGHT_NEMULATOR.md) | Run, shipped vs v2 |
| [FLIGHT_NEMULATOR_BATTLEWORLD_ARCS.md](./FLIGHT_NEMULATOR_BATTLEWORLD_ARCS.md) | Arc beats, pair policy |
| [FLIGHT_NEMULATOR_FULL_ROSTER.md](./FLIGHT_NEMULATOR_FULL_ROSTER.md) | Homage map |
| [FLIGHT_NEMULATOR_XMEN_RESEARCH.md](./FLIGHT_NEMULATOR_XMEN_RESEARCH.md) | X-Men backlog |
| [FLIGHT_NEMULATOR_ROSTER_BACKLOG.md](./FLIGHT_NEMULATOR_ROSTER_BACKLOG.md) | Marvel / DC / DBZ / off-brand / Transformers research |

## APIs (Tortuca monorepo)

| Route | Role |
|-------|------|
| `POST /api/flight-nemulator-research` | Homage-safe hero drafts |
| `GET/POST /api/flight-nemulator-lattice` | Optional arc beat cloud sync |

Client env: `VITE_FN_RESEARCH_URL`, `VITE_BATTLEWORLD_LATTICE_URL`. Lattice fetches send `X-Alfred-Session` when the console shell has `alfred-session-id` in localStorage.

## CI

```bash
npm run test:flight-nemulator   # from repo root
cd flight-nemulator && npm run test:smoke  # build + headless tap when Chrome exists
```
