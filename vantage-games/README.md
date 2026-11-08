# VantageGames

**Title-card launcher** for Tortuca browser games — no sign-in. Scroll **City Nights** and **Battleworld**, tap a card, and the game loads.

Deploy as its **own** Netlify site (**`vantagegames1`**, https://vantagegames1.netlify.app) with base directory `vantage-games` — not Alfred (`alfred2`). See [`../docs/VANTAGE_GAMES_DEPLOY.md`](../docs/VANTAGE_GAMES_DEPLOY.md).

## Bundled games

`npm run build:with-console` packages [`games-hub`](../games-hub/) into `public/console/`:

| Card | Game |
|------|------|
| **City Nights** | `/console/city-nights/` |
| **Battleworld** | `/console/flight-nemulator/` (Flight Nemulator) |

Optional env: `VITE_VANTAGE_CONSOLE_URL`, `VITE_CITY_NIGHTS_URL`, `VITE_FLIGHT_NEMULATOR_URL`.

From a game, **◯ VantageGames** on the console returns to this launcher at `/`.

## Deploy

1. Base directory **`vantage-games`**
2. Build: `npm ci && npm run build:with-console` (`netlify.toml`)
3. Publish: `dist`

## Local

```bash
cd vantage-games
npm install
npm run build:with-console
npm run preview
```
