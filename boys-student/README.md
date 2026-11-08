# BOYS Games

**Title-card launcher** for Tortuca browser games — no class code, no sign-in. Students scroll **City Nights** and **Battleworld**, tap a card, and the game loads.

Curriculum check-ins stay on the Family Purpose mentor app; this site is games only.

## Bundled games

Netlify build runs `npm run build:with-console`, which packages [`games-hub`](../games-hub/) into `public/console/`:

| Card | Game |
|------|------|
| **City Nights** | `/console/city-nights/` |
| **Battleworld** | `/console/flight-nemulator/` (Flight Nemulator) |

Optional env overrides: `VITE_BOYS_CONSOLE_URL`, `VITE_CITY_NIGHTS_URL`, `VITE_FLIGHT_NEMULATOR_URL`.

From a game, **◯ BOYS** (or **◯ Console** → home) returns to this launcher at `/`.

## Deploy on Netlify

1. Base directory **`boys-student`**
2. Build: `npm run build:with-console` (default in `netlify.toml`)
3. Publish: `dist`
4. `VITE_BOYS_API_URL` is **not** required for this launcher.

## Local

```bash
cd boys-student
npm install
npm run build:with-console
npm run preview
# open / — scroll cards, tap to play
```

For API work on the old curriculum flow, use Family Purpose + `npm run dev` with `BOYS_API_PROXY` (see `family-purpose/NETLIFY.md`).
