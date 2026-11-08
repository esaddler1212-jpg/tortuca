# Flight Nemulator

Browser **hero flight sandbox** (PlayCanvas + Vite). Homage codenames only — fan tribute, not affiliated with Marvel, DC, Shueisha, etc.

## Battleworld (your crossover planet)

One ring planet (**Battleworld**) holds nine homage districts. Playable legends from **Marvel**, **DC**, and **DBZ** share the same sky: territory raids, pair-rival finales, God-Emperor / timeline Doom endings, and villain advisors all happen on this patchwork world — not separate canon Earths. Universe tags live in `roster-mutations.ts`; the HUD labels districts `Battleworld · …`.

## Run

```bash
cd flight-nemulator
npm install
npm run dev
```

Production build: `npm run build` → `dist/` (static deploy like `drive-world`).

**Free assets:** see [`GAMEDEV_RESOURCES.md`](./GAMEDEV_RESOURCES.md). Optional Kenney audio/city GLBs: `bash tools/gamedev-resources/install-free-packs.sh --all` from repo root.

## Design (v1)

| Area | Behavior |
|------|----------|
| World | **One Earth** — nine homage cities on a ~14 km ring; fly between cells, orbit fast (400+ km/h, high altitude) to **chrono-freeze** drones, **E Super** to shatter the planet and rebuild (generation counter) |
| Flight | Third-person **realistic arcade** 6DOF — cruise and absurd boost bands |
| Destruction | Ram **destructibles** only; chunk debris on capable hardware, instant vanish on low tier |
| Ruins | Buildings **stay ruined** for the session |
| Role | **Hero** — stop **villain clones** (DBZ / Marvel / DC homage roster paired to your hero). **Villain** — hero interceptors chase you |
| Clones | 31 in `villain-roster.ts` with rival pairings |
| X-Men research | [`FLIGHT_NEMULATOR_XMEN_RESEARCH.md`](./FLIGHT_NEMULATOR_XMEN_RESEARCH.md) |
| Mutations | Full homage map in [`FLIGHT_NEMULATOR_FULL_ROSTER.md`](./FLIGHT_NEMULATOR_FULL_ROSTER.md) and `roster-mutations.ts` |
| World fate | **Villain:** city ≤12% → **5 min dying roam** → auto reset or **Remake in my image** (themed Earth + your statues at every district). **Hero:** save at ≥52% integrity after clearing waves → **monument in hometown only** (persists) |
| Combat | Primary / throw / super; wave spawns depend on role |
| Economy | **Destruction cost** score + **wanted** heat when wrecking too much |
| Roster | Full launch roster + Iron suits / form toggles; **custom hero** in local storage |
| Aerial | Every hero/villain has `aerial` mobility; grounded homages get **jetpack** or **glide** visuals — see [`FLIGHT_NEMULATOR_AERIAL_ROSTER.md`](./FLIGHT_NEMULATOR_AERIAL_ROSTER.md) |
| Customization | Iron Man, War Machine, Batman — deepest suit libraries; see [`FLIGHT_NEMULATOR_CUSTOMIZATION.md`](./FLIGHT_NEMULATOR_CUSTOMIZATION.md) |
| Online | Optional `manifest-updates.json` fetch for new skins/characters (offline-first) |
| Research agent | Client hook `character-research.ts` — wire to Tortuca `/api/...` when product adds server |

## Shipped in v1 (Battleworld branch)

| Area | Status |
|------|--------|
| Planet shell + nine districts + orbit chrono-freeze | Shipped |
| Territory takeovers, advisors, raze/henchmen, **territory-clear** arc beat | Shipped |
| Infinity Stone hunt vs Thanos/Loki/Ultron homages | Shipped |
| 37 hero arcs + lattice (`battleworld-arcs.ts`, HUD chip, picker arc + links) | Shipped |
| **`home-mark`** H at every hero home district + villain runway HUD | Shipped |
| Wave-10 pair rivals (5 pinned finales + rival fallback) | Shipped — see [`FLIGHT_NEMULATOR_BATTLEWORLD_ARCS.md`](./FLIGHT_NEMULATOR_BATTLEWORLD_ARCS.md) |
| Doom timeline / God Emperor, Solar Lantern rings, symbiote, absorb heroes | Shipped |
| Home spires, quality override, boost trails, super crater, screen shake | Shipped |
| Wanted-scaled waves, power-tuned primaries, minimap, photo save, session stats | Shipped |
| Full roster (DBZ ki squad, Velocity Streak, dual Doom, villain-only absorb legends) | Shipped |
| `netlify/functions/flight-nemulator-research.ts` + client research hook | Shipped (wire Tortuca auth when live) |
| Kenney / World Gacha / Poly Haven hooks | Shipped (optional install) |

## v2 (not in v1)

| Item | Notes |
|------|-------|
| Multiplayer | Not started |
| Mission chapters / checkpoint races | Not started |
| Blockbench hero GLBs for full roster | `public/models/heroes/` pipeline only — **0** bundled GLBs |
| Universe-colored district rims / sky rings | **Shipped** — rim + fog tint (`battleworld-districts.ts`) |
| Per-hero district **H** at home turf (`home-mark` beat) | **Shipped** — Lantern/Ki/Iron specials unchanged |
| X-Men tier A roster (`FLIGHT_NEMULATOR_XMEN_RESEARCH.md`) | Research only |
| `manifest-updates.json` stub IDs → playable characters | OTA placeholder |

## Tortuca / IRIS

Standalone Netlify site or `public/flight-nemulator/` redirect — same pattern as [PLAYCANVAS_INBROWSER_GAME.md](./PLAYCANVAS_INBROWSER_GAME.md).

Standalone deploy: create a site from this repo with **base directory `flight-nemulator`**; `flight-nemulator/netlify.toml` sets the build (`npm ci && npm run build`), publish dir `dist`, and SPA fallback.

## Testing

`npm run test:smoke` boots `dist/` in headless Chrome, taps start, holds W for 3 s, and fails on runtime errors (set `CHROME_PATH` if Chrome is not auto-detected). CI: `.github/workflows/flight-nemulator.yml` runs build + smoke on changes under `flight-nemulator/`.
