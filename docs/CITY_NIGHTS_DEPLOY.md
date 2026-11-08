# City Nights — deploy (Netlify)

**City Nights** is the game in [`drive-world/`](../drive-world/) (PlayCanvas + React HUD).

## New Netlify site (recommended)

1. [Netlify](https://app.netlify.com/) → **Add new project** → **Import an existing project** → GitHub `esaddler1212-jpg/tortuca`.
2. **Site name:** e.g. `city-nights` → `https://city-nights.netlify.app` (pick any available name).
3. **Build settings**
   - **Branch:** `main`
   - **Base directory:** `drive-world`
   - **Build command:** `npm ci && npm run build` (also in [`drive-world/netlify.toml`](../drive-world/netlify.toml))
   - **Publish directory:** `dist`
4. Deploy. Every push to `main` that touches `drive-world/` can auto-deploy if continuous deployment is on.

### CLI (optional)

From repo root, with [Netlify CLI](https://docs.netlify.com/cli/get-started/) logged in:

```bash
cd drive-world
npm ci && npm run build
npx netlify deploy --prod --dir=dist
```

First time: `npx netlify init` and link the site (same base dir / build command as above).

## Chromebook testing

- Open the **deployed HTTPS URL** in Chrome (easiest; no Linux required).
- Or enable **Linux**, install Node 18+, then `npm ci && npm run dev -- --host 127.0.0.1` and visit `http://127.0.0.1:5173`.
- Progress is **localStorage** in that browser profile (not cloud).

## Monorepo note

The main Tortuca IRIS PWA builds from the repo root `netlify.toml`. Keep **City Nights** as a **separate Netlify site** with base directory `drive-world` unless you deliberately add a subpath build.
