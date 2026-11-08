# City Nights

Open-world **Bay Area night driving** prototype (PlayCanvas + Ammo + React HUD). Freeway waypoints in `world-config.ts` follow the real corridor layout (I-80, 101/280 pair, 880 east shore, 24, 680, 580 Marin, 780 Carquinez) on a compressed map. Each city is a set of **landmark-centered hubs** (`city-map-registry.ts`): compact grids, monument loops, plaza pads, and arterials (Market, Telegraph, El Camino, **Emeryville Bay St**, etc.). **Green street signs** at hub crossings; the HUD shows the current street name while you drive (`street-name-registry.ts`).

Folder name remains `drive-world/` for Netlify base-directory wiring; the product name is **City Nights**.

## Local dev

```bash
cd drive-world
npm ci
npm run dev
```

Chrome / Chromebook: desktop Chrome with WebGL.

### iPhone & iPad (Safari)

- Open the deployed **HTTPS** site (required for WebGL + WASM physics).
- **Tap to start** unlocks audio and the engine.
- **Touch pad** (steer / throttle / **N₂O** / flight climb & sink) shows on all touch devices, including iPad landscape.
- **Landscape** on phone gives more road view; portrait works but is tight.
- Add to Home Screen for fullscreen (`apple-mobile-web-app-capable` is set).
- Defaults on first visit: **low fog**, capped pixel ratio, lighter shadows for battery/GPU.

Flight without a keyboard: use **⤒ / ⤓** on the touch pad. Photo mode and HUD buttons use normal taps.

### Home & custom safehouses

Default home is the **Vallejo estate** with a **Fast & Furious–style garage**. Regional unlocks add **penthouses** (SF, Oakland, Walnut Creek, Marin, Napa, San José) and **condos** on the Peninsula and other districts. **Penthouses** use a **valet pull-up** (canopy on the map); **estates & condos** use a lit **garage door**. Park below **12 mph** to **claim a condo** anywhere else (up to five customs). Fleet/tuning opens only when you stop at the valet or door.

## Deploy

See [`docs/CITY_NIGHTS_DEPLOY.md`](../docs/CITY_NIGHTS_DEPLOY.md).
