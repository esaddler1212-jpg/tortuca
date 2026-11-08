# Flight Nemulator

Browser **hero flight sandbox** (PlayCanvas + Vite). Homage codenames only — fan tribute, not affiliated with Marvel, DC, Shueisha, etc.

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
| Clones | 21 in `villain-roster.ts` with rival pairings |
| Mutations | Full homage map in [`FLIGHT_NEMULATOR_FULL_ROSTER.md`](./FLIGHT_NEMULATOR_FULL_ROSTER.md) and `roster-mutations.ts` |
| World fate | **Villain:** city ≤12% → **5 min dying roam** → auto reset or **Remake in my image** (themed Earth + your statues at every district). **Hero:** save at ≥52% integrity after clearing waves → **monument in hometown only** (persists) |
| Combat | Primary / throw / super; wave spawns depend on role |
| Economy | **Destruction cost** score + **wanted** heat when wrecking too much |
| Roster | Full launch roster + Iron suits / form toggles; **custom hero** in local storage |
| Aerial | Every hero/villain has `aerial` mobility; grounded homages get **jetpack** or **glide** visuals — see [`FLIGHT_NEMULATOR_AERIAL_ROSTER.md`](./FLIGHT_NEMULATOR_AERIAL_ROSTER.md) |
| Online | Optional `manifest-updates.json` fetch for new skins/characters (offline-first) |
| Research agent | Client hook `character-research.ts` — wire to Tortuca `/api/...` when product adds server |

## Today’s stretch goals (in progress on branch)

- Indestructible district home spires + Bat-cave mouth landmark
- Quality-tier city density + manual quality override in HUD
- Boost trails, super crater ring, camera shake
- Wanted-scaled defense waves + power-specific primaries
- Minimap, session lifetime stats, photo save
- Expanded roster (Shade Knight, Amazon Vanguard, Bolt Archer, Ant Scale, Dr. Doom)
- `POST /api/flight-nemulator-research` homage draft suggestions (main repo function)

## v2 (not in v1)

Multiplayer, mission chapters, checkpoint races, GLB hero models.

## Tortuca / IRIS

Standalone Netlify site or `public/flight-nemulator/` redirect — same pattern as [PLAYCANVAS_INBROWSER_GAME.md](./PLAYCANVAS_INBROWSER_GAME.md).
