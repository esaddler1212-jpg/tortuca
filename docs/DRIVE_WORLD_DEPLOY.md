# Deploy Drive World (Netlify)

> **Renamed for players:** **City Nights**. Use [`CITY_NIGHTS_DEPLOY.md`](./CITY_NIGHTS_DEPLOY.md) for the current deploy checklist.

[`drive-world/`](../drive-world/) is a **standalone Vite** app (PlayCanvas + React HUD).

## New Netlify site (recommended)

1. Netlify → **Add site** → import `esaddler1212-jpg/tortuca`.
2. **Base directory:** `drive-world`
3. Build command / publish directory come from [`drive-world/netlify.toml`](../drive-world/netlify.toml): `npm ci && npm run build` → `dist`
4. Deploy.

## Local production check

```bash
cd drive-world
npm ci
npm run build
npm run preview
```

## Monorepo note

The main Tortuca IRIS site uses the root `netlify.toml` and `dist/` from the Vite PWA. Do **not** merge Drive World into that publish path unless you add a dedicated redirect (e.g. `/drive/*` → separate site or subfolder build).
