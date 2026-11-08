# City Nights — audit (Nov 2026, pass 2)

Compressed **Bay Area night sandbox** in `drive-world/` (PlayCanvas 2.23 + Ammo + React HUD). Single-player browser game: Waymo intro → safehouse starter → taco truck + landmark per region → regional cars, safehouses, homage fleet, parking, fuel, sideshows, Bay navigation.

## How this audit was run

| Check | Result |
|-------|--------|
| `npm run build` (Vite) | Passed — but Vite does **not** typecheck |
| `npx tsc --noEmit` | **24 errors** before this pass → **0** after |
| Headless Chrome (SwiftShader WebGL) boot | **Crashed on boot** before this pass → clean boot, 0 console errors |
| CDP smoke: skip Waymo → pick starter → hold W 8 s | Car drives (~30 mph), street blade, nav, fuel, minimap all populate |
| Landmark id cross-check (routes/connectors vs registry) | 1 bad id (`oracle`) → fixed |

## P0 — fixed in this pass (game was not playable)

| Bug | Effect | Fix |
|-----|--------|-----|
| `app.scene.fog = Color` | PlayCanvas 2.x `scene.fog` is getter-only → **TypeError at boot**, world never built; fog was never actually enabled | Set `scene.fog.type = FOG_LINEAR` + `fog.color` |
| `scripts/vehicle.js` reads global `pc` | ESM build has no `pc` global → **vehicle physics script never registered** | `src/pc-global.ts` exposes the 12 symbols the script uses (keeps tree-shaking; full namespace doubled the bundle) |
| `FREEWAY_780` not imported in ramps | ReferenceError during world build | Import added |
| `Vec3.lerp(...)` static call | Does not exist → TypeError every frame in chase/drone/vista cams | Instance `smoothPos.lerp(...)` |
| SF loop uses `'oracle'` | `Unknown landmark oracle` thrown at module load | `'oracle-park'` |
| `.overlay { display: flex }` beats `[hidden]` | Blurred car picker **covered the screen forever** (incl. Waymo intro) | Global `[hidden] { display: none !important }` |
| Kenney GLBs reference `Textures/colormap.png` (missing) | All GLB cars failed → block-body fallback only | Vendored CC0 texture from the same mirror |
| Touch `nitro` never returned | N₂O pad did nothing on phones/iPad | `computeTouchControls` returns `nitro` |
| Garage panel + React HUD both pinned right | Overlapping unreadable panels at every safehouse | Garage moved to left column, scrolls in viewport |
| Onboarding copy | Still said "clear every landmark" (old rule) | Taco truck + any landmark wording |

**Guard added:** `npm run build` is now `tsc --noEmit && vite build`, so CI and Netlify fail on type errors. Every P0 above except CSS/asset issues would have been caught by this.

## P1 — next, highest player impact

| Need | Why | Scope |
|------|-----|-------|
| **Browser smoke test in CI** | Today's crashes shipped because nothing booted the game. A headless Chrome + SwiftShader boot (script used in this audit) catches boot exceptions in ~60 s | `scripts/` CDP script + step in `.github/workflows/city-nights.yml` |
| **Chase camera collision** | Camera clips inside buildings/garage walls at spawn and in dense hubs (visible in smoke screenshots) | Raycast from car to camera target in `camera-profiles.ts`, pull camera in on hit |
| **HUD density** | Right column stacks ~10 panels (missions, stats, settings, fast travel, landmarks, search, music, journal…). Crowded at 1280×720, worse on phones | Collapse into one tabbed "Map / Missions / Garage / Settings" drawer; keep minimap + speed always on |
| **First-session clarity** | Player lands at Vallejo with 37 landmarks, 6 taco trucks, 14 parking bays, 10 vistas, 5 homage tokens, scenic routes — no "do this first" | Single pinned objective that advances (first taco truck → first unlock), rest behind the mission tab |
| **Nav hint polish** | Shows `Bear right · 0.0 mi` when the next leg point is close | Skip legs < ~80 m; show street name of next leg when available |
| **Hub streaming hitch** | Building a hub's blocks + static colliders happens in one frame when you approach | Spread `buildCityHubBlocks` over several frames (chunk per update) |

## P2 — quality and robustness

| Item | Notes |
|------|-------|
| Lighting cost | Up to 140 freeway point lights + taco/gas/safehouse/vehicle point lights. Fine on desktop clustered lighting; measure on Chromebook / iPhone, cap via Bay quality preset |
| Bundle | 1.26 MB PlayCanvas chunk (336 KB gzip) + 223 KB React. Acceptable; Ammo WASM on top |
| Cloud save endpoint | `city-nights-progress` is unauthenticated by design (random sync key), CORS `*`, 120 KB cap, **no rate limit**. Add a simple per-key write throttle |
| Save key naming | Storage key is still `drive-world-progress-v5` while data is v7. Works; rename only with a migration |
| Geography overlap | Oracle Park (−880, −610) and Chase Center (−878, −598) are **12 m apart** — beacons/meshes overlap. Real-world they're ~1 km apart; nudge Chase Center south |
| `game-loop.ts` size | 1,060+ lines; nav, fuel, parking, streaming, HUD publish all inline. Split per system before adding more |
| No unit tests in `drive-world/` | Pure modules (`bay-navigation`, `fuel-system`, `parking-rewards`, save migration) are easy Vitest targets |
| Accessibility | 4 `aria-*` usages across HUD; no reduced-motion option for vista pulse / sideshow spin |

## P3 — content / feature wishlist (vs open-world driving peers)

| Common feature | City Nights today | Suggested |
|----------------|-------------------|-----------|
| Traffic | 4 box cars on one I-80 segment | Per-freeway loops + hub street traffic, density from quality preset |
| Police / chases | Speed-trap heat meter only | Light pursuit when heat ≥ 4, lose it in tunnels |
| Races / events | Speed traps, scenic routes, parking | Point-to-point sprints between landmarks with ghost best time |
| Day/night | Night only (on brand) | Dusk → night sky gradient on the Waymo intro only |
| Weather | Regional fog | Rain sheen preset for SF/Marin |
| Damage | None | Cosmetic scuffs only (keeps cozy tone) |
| Audio | Procedural engine + playlist support | `public/music/` has no tracks yet — add CC0 lo-fi set |
| Multiplayer | None | Ghost replays / shared sideshow schedule before real-time MP |
| Interiors | None | Garage interior camera at the Vallejo estate |

## What is healthy

- Progression loop (Waymo → starter → taco + landmark → unlocks) works end-to-end in a real browser.
- Save migration v2 → v7 typechecks; cloud merge and JSON import/export accept v5–v7.
- Settings presets (Chromebook / Balanced / Lush), hub streaming, fuel toggle, sideshow toggle all wired.
- Homage content carries "not affiliated" copy.

---

_Pass 2: boot crash fixes, typecheck gate, layout fix, headless smoke. Prior pass covered Telegraph / Caldecott / Orinda / Concord / Walnut Creek / Martinez geography._
