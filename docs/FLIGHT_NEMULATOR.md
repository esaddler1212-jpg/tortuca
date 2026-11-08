# Flight Nemulator

Browser **hero flight sandbox** (PlayCanvas + Vite). Homage codenames only — fan tribute, not affiliated with Marvel, DC, Shueisha, etc.

## Run

```bash
cd flight-nemulator
npm install
npm run dev
```

Production build: `npm run build` → `dist/` (static deploy like `drive-world`).

## Design (v1)

| Area | Behavior |
|------|----------|
| World | Full open procedural metro (~4 km) with **district home bases** (Stark Spire, Cave of Night, Planet Watch, Ki Plateau, …) |
| Flight | Third-person **realistic arcade** 6DOF — cruise and absurd boost bands |
| Destruction | Ram **destructibles** only; chunk debris on capable hardware, instant vanish on low tier |
| Ruins | Buildings **stay ruined** for the session |
| Combat | City-defense **waves** — primary fire, telekinetic throw, **super crater** |
| Economy | **Destruction cost** score + **wanted** heat when wrecking too much |
| Roster | Full launch roster + Iron suits / form toggles; **custom hero** in local storage |
| Online | Optional `manifest-updates.json` fetch for new skins/characters (offline-first) |
| Research agent | Client hook `character-research.ts` — wire to Tortuca `/api/...` when product adds server |

## v2 (not in v1)

Multiplayer, mission chapters, checkpoint races.

## Tortuca / IRIS

Standalone Netlify site or `public/flight-nemulator/` redirect — same pattern as [PLAYCANVAS_INBROWSER_GAME.md](./PLAYCANVAS_INBROWSER_GAME.md).
