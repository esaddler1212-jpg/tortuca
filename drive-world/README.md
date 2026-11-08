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

Default home is the **Vallejo estate** with a **Fast & Furious–style garage**. Regional unlocks add **penthouses** and **condos**. Pull up to any unlocked **valet/garage** for the full fleet. **Green parking bays** at 14 landmarks — slow in, line up heading, earn up to 3★ (unlocks extra Kenney rides at 4 / 8 / 12 badges). **Fuel sim** (optional in Settings) drains gently while driving; **blue-green pump canopies** refill free. Garage tuning adds **camber, spoiler, livery stripe, exhaust note** on top of paints and handling.

**Bay homage fleet** (fan tribute, not affiliated): collect glowing tokens to unlock Time Warp Coupe (**hover flight**), Hyphy Short Bus, Cookie Tour Bus, Say Hey Lowrider, and Beast Mode Cart. **Sideshow meetups** rotate every ~2.5 minutes across eight lots (lineup + donut cars) — toggle in Settings.

### Bay navigation (EarthNG-inspired, compressed map)

- **Street-following routes** on monument loops (`bay-navigation.ts`) with turn hints and a multi-segment minimap line.
- **City map search** — find any hub or landmark, **Route** (pin) or **Land here** (teleport under ~22 mph).
- **Storefront strips** near Telegraph, Emeryville Bay St, Embarcadero, and Concord plaza (3D signs + HUD strip label).
- **Hub parking rows** at every `CITY_HUBS` center; **green dots** on the minimap are free gas pumps.
- **Bay quality preset** in Settings (Chromebook / Balanced / Lush) adjusts fog, traffic, sideshow, and fuel sim.

## Deploy

See [`docs/CITY_NIGHTS_DEPLOY.md`](../docs/CITY_NIGHTS_DEPLOY.md).
