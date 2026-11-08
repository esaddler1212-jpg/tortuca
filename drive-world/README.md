# City Nights

Open-world **Bay Area night driving** prototype (PlayCanvas + Ammo + React HUD).

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

## Deploy

See [`docs/CITY_NIGHTS_DEPLOY.md`](../docs/CITY_NIGHTS_DEPLOY.md).
