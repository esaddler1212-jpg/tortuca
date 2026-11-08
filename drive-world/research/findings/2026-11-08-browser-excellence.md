# Browser excellence research — City Nights (2026-11-08)

Synthesis from PlayCanvas/MDN guidance, mobile WebGL practice, existing [`CITY_NIGHTS_AUDIT.md`](../../../docs/CITY_NIGHTS_AUDIT.md), and Tortuca codebase review. **Implement** in `drive-world/`; do not clone third-party assets.

## Executive — what makes it “dope” in-browser

| Tier | Theme | Why players feel it |
|------|--------|---------------------|
| **P0** | Never break boot | One WebGL crash = instant churn ([audit P0 history](../../../docs/CITY_NIGHTS_AUDIT.md)) |
| **P0** | Mobile-first input + audio | Safari kills autoplay; touchcancel and safe-area separate good web racers from demos |
| **P1** | Stable 30–60 fps on Chromebook | Draw calls, physics cost, pixel ratio, hub hitches |
| **P1** | Readable HUD | Minimap + speed + *one* objective visible; rest in drawers |
| **P2** | “Horizon” moments | Photo slow-mo, PB fanfare, vistas — already partially shipped |
| **P2** | Density that feels alive | Traffic, meets, street blades — quality preset gated |

## P0 — ship next (high confidence)

| # | Update | Evidence / source | Tortuca target |
|---|--------|-------------------|----------------|
| 1 | **CI boot smoke** (headless Chrome + SwiftShader) | Audit: crashes shipped without runtime test | `scripts/city-nights-smoke.mjs`, `.github/workflows/city-nights.yml` |
| 2 | **iOS audio interrupt resume** | MDN + iOS WebView state `interrupted` | `game-audio.ts`, `game-music.ts` |
| 3 | **touchcancel → release all touch keys** | iOS Safari gesture steals touch | `HudApp.tsx` TouchControlsImpl |
| 4 | **Nav hint skip short legs** (≥ ~80 m) | Audit P1; avoids “0.0 mi” noise | `bay-navigation.ts` (`navTurnHint`) |
| 5 | **Chase cam terrain pull-in** | PlayCanvas cam clipping in hubs | `camera-profiles.ts` (terrain LOS, not full mesh ray yet) |

## P1 — polish (next sprint)

| # | Update | Notes | Target files |
|---|--------|-------|--------------|
| 6 | **HUD drawer defaults on phone** | Collapse missions/settings/journal by default on touch | `HudApp.tsx`, `hud.css` |
| 7 | **`prefers-reduced-motion`** | Heat pulse, sideshow spin, vista pulse | `hud.css`, `starter.css` |
| 8 | **Hub streaming time-slice** | Avoid single-frame hitch | `hub-streaming.ts`, `build-hub-chunked.ts` — **shipped P2** |
| 9 | **Light cap on Chromebook** | PlayCanvas: minimize dynamic lights | `build-districts.ts`, `bay-quality.ts` |
| 10 | **CC0 music in `public/music/`** | Empty playlist = less “festival” | `playlist.json` + `bay-night-cruise.ogg` — **shipped P2** |
| 11 | **Draw call pass** | Target 100–200 on mobile (PlayCanvas guidelines) | Batch static hub geometry where materials match |
| 12 | **Cloud save throttle** | Abuse / cost | `city-nights-progress.ts` |

## P2 — “dope” content (CPM × MC × Horizon)

Already on `main` after merge: Vallejo chapter, racing HUD, nitro tank, drag tree, Craft Anything research toolchain.

| # | Update | Feel |
|---|--------|------|
| 13 | Ghost PB on drag/time (localStorage/Blobs) | Horizon rivalry — **shipped** (`cpm-ghost.ts`, save v9) |
| 14 | Heat ≥ 4 chaser car (box cop) | Midnight Club — **shipped** (`heat-chaser.ts`) |
| 15 | 2–3 freeway traffic loops | MC density — **shipped** (I-80 / 880 / 101) |
| 16 | Garage interior camera at Vallejo estate | Forza garage fantasy |
| 17 | Point-to-point sprint between landmarks | MC + CPM |

## P3 — browser platform

| Topic | Recommendation |
|-------|----------------|
| **Load** | Phased preload: Waymo assets → garage → Bay (`main.ts` / asset flags) |
| **VRAM** | Kenney + hub textures: downsample; avoid raising `maxPixelRatio` on weak GPUs |
| **PWA** | Keep `viewport-fit=cover`, theme-color; optional service worker for shell cache only |
| **Wasm physics** | Ammo ~379 KB — acceptable for driving; don’t add second physics libs |

## Craft Anything follow-ups

Run `npm run craft:install`, brief in [`briefs/browser-excellence.md`](../briefs/browser-excellence.md), capture **your** Netlify URL + local dev at 390×844 and 1280×720. Store only this markdown + future dated findings in git.

## Implemented from this doc (same PR)

- Nav 80 m leg threshold
- iOS `AudioContext` statechange resume hook
- Touch `pointercancel` clears controls
- Chase camera terrain line-of-sight pull-in
- `prefers-reduced-motion` CSS
- Mobile-default collapsed mission/settings/journal panels
- `npm run test:smoke` + CI step
