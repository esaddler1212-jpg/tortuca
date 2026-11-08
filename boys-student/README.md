# VantageGames

**Title-card launcher** for Tortuca browser games — no sign-in. Scroll **City Nights** and **Battleworld**, tap a card, and the game loads.

Folder on disk is still `boys-student/` (Netlify base directory unchanged). Curriculum check-ins stay on Family Purpose; this site is games only.

## Bundled games

Netlify build runs `npm run build:with-console`, which packages [`games-hub`](../games-hub/) into `public/console/`:

| Card | Game |
|------|------|
| **City Nights** | `/console/city-nights/` |
| **Battleworld** | `/console/flight-nemulator/` (Flight Nemulator) |

Optional env: `VITE_BOYS_CONSOLE_URL` or `VITE_VANTAGE_CONSOLE_URL`, plus `VITE_CITY_NIGHTS_URL` / `VITE_FLIGHT_NEMULATOR_URL`.

From a game, **◯ VantageGames** on the console returns to this launcher at `/`.

## Deploy on Netlify

1. Base directory **`boys-student`**
2. Build: `npm run build:with-console` (default in `netlify.toml`)
3. Publish: `dist`

## Local

```bash
cd boys-student
npm install
npm run build:with-console
npm run preview
```
