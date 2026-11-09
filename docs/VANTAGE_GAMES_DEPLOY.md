# VantageGames — deploy (Netlify)

**VantageGames** is its own static Netlify site. It is **not** the Alfred (`alfred2`) app and does not use repo-root `netlify.toml` or `/api/*` functions.

Production site: **`vantagegames1`** — https://vantagegames1.netlify.app

## Create the site

1. In Netlify: **Add new site** → Import from Git → this repo.
2. **Site name:** **`vantagegames1`**
3. **Build settings:**
   - **Base directory:** `vantage-games` (**required** — wrong folder = wrong app)
   - **Build command:** `npm ci && npm run build:with-console` (also in [`vantage-games/netlify.toml`](../vantage-games/netlify.toml))
   - **Publish directory:** `dist`
4. **Environment variables:** none required (no Google sign-in, no Family Purpose API).

### Wrong build? (City Nights only at `/`)

If the home page title is **City Nights** and you see “Tap to start”, Netlify is building **`drive-world`** (or another game folder) instead of the launcher.

| Symptom | Wrong base directory | Fix |
|--------|----------------------|-----|
| `/` = City Nights game | `drive-world` | Set base to **`vantage-games`** |
| `/` = Console grid only | `games-hub` | Set base to **`vantage-games`** |
| `/` = Alfred / Iris | *(repo root)* | Use a **different** site for Alfred |

After saving, **Deploys → Trigger deploy → Clear cache and deploy site**.

Do **not** use `boys-student`, `boys-with-purpose`, or `drive-world` as the base directory for vantagegames1.

## What gets published

- `/` — scrollable title cards (React)
- `/console/` — Tortuca Console shell from [`games-hub/`](../games-hub/)
- `/console/city-nights/` — City Nights build
- `/console/flight-nemulator/` — Battleworld / Flight Nemulator build

## Alfred vs VantageGames

| | Alfred (repo root) | VantageGames |
|--|-------------------|----------------|
| Netlify base dir | *(empty / root)* | `vantage-games` |
| Auth | Google session for Iris | None |
| Functions | `netlify/functions/*` | None (static only) |

Lattice cloud sync on Flight Nemulator (`/.netlify/functions/flight-nemulator-lattice`) only applies when the game is deployed on a site that ships those functions (e.g. Alfred production). The VantageGames bundle is offline-first; lattice APIs are optional.

## Local

```bash
cd vantage-games
npm install
npm run build:with-console
npm run preview
```

## Script deploy

Links and deploys to Netlify site **`vantagegames1`** by default:

```bash
NETLIFY_AUTH_TOKEN=... bash scripts/deploy-netlify.sh
```

Override with `VANTAGE_GAMES_SITE_NAME` if needed. (The script also deploys Family Purpose when run; see `scripts/deploy-netlify.sh`.)
