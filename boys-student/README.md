# VantageGames

**Title-card launcher** for Tortuca browser games — no sign-in. Scroll **City Nights** and **Battleworld**, tap a card, and the game loads.

Netlify **base directory** is still `boys-student/` (legacy path). This replaces the earlier **Battleworld portal** on `main` (single-game landing) and the legacy BOYS curriculum student app.

## Bundled games

`npm run build:with-console` packages [`games-hub`](../games-hub/) into `public/console/`:

| Card | Game |
|------|------|
| **City Nights** | `/console/city-nights/` |
| **Battleworld** | `/console/flight-nemulator/` (Flight Nemulator) |

Optional env: `VITE_VANTAGE_CONSOLE_URL`, `VITE_CITY_NIGHTS_URL`, `VITE_FLIGHT_NEMULATOR_URL`.

From a game, **◯ VantageGames** on the console returns to this launcher at `/`.

## Deploy

1. Base directory **`boys-student`**
2. Build: `npm ci && npm run build:with-console` (`netlify.toml`)
3. Publish: `dist`

## Local

```bash
cd boys-student
npm install
npm run build:with-console
npm run preview
```
