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
| ~~**Browser smoke test in CI**~~ | **Done:** `drive-world/scripts/smoke-boot.mjs` + `npm run test:smoke` in `.github/workflows/city-nights.yml` | **Done:** smoke skips Waymo and holds W for 5 s |
| ~~**Chase camera collision**~~ | **Done:** raycast in `camera-profiles.ts` skips the player car and Tokyo ground; chase uses Bullet +Z travel (opposite PlayCanvas `forward`). Tight garages can still clip | Raycast from car to camera target, pull camera in on hit |
| ~~**Tokyo bonus map**~~ | **Done:** Bay completion → SFO FF gate → Haneda; **8 landmarks = 8 FF tribute cars** (`npm run test:tokyo`, `test:wiring`) | MCLA Remix–style second map + Fast family fleet |
| ~~**HUD density**~~ | **Done:** tabbed Map / Missions / Garage / Settings drawer. Was: right column stacks ~10 panels (missions, stats, settings, fast travel, landmarks, search, music, journal…). Crowded at 1280×720, worse on phones | Collapse into one tabbed "Map / Missions / Garage / Settings" drawer; keep minimap + speed always on |
| ~~**First-session clarity**~~ | **Done:** one pinned Chapter 1 objective (Vallejo taco + landmark opens the Bay). Was: player lands at Vallejo with 37 landmarks, 6 taco trucks, 14 parking bays, 10 vistas, 5 homage tokens, scenic routes — no "do this first" | Single pinned objective that advances (first taco truck → first unlock), rest behind the mission tab |
| ~~**Nav hint polish**~~ | **Done:** legs < 80 m skipped. Was: shows `Bear right · 0.0 mi` when the next leg point is close | Skip legs < ~80 m; show street name of next leg when available |
| ~~**Hub streaming hitch**~~ | **Done:** chunked build across frames in `hub-streaming.ts`. Was: building a hub's blocks + static colliders happens in one frame when you approach | Spread `buildCityHubBlocks` over several frames (chunk per update) |

## P2 — quality and robustness

| Item | Notes |
|------|-------|
| Lighting cost | **Capped:** freeway lamp budget per Bay quality preset (`build-world.ts`). Was: up to 140 freeway point lights + taco/gas/safehouse/vehicle point lights. Fine on desktop clustered lighting; measure on Chromebook / iPhone, cap via Bay quality preset |
| Bundle | 1.26 MB PlayCanvas chunk (336 KB gzip) + 223 KB React. Acceptable; Ammo WASM on top |
| Cloud save endpoint | `city-nights-progress` is unauthenticated by design (random sync key), CORS `*`, 120 KB cap, **no rate limit**. **Done:** per-key write throttle (`MIN_WRITE_GAP_MS`) |
| Save key naming | Storage key is still `drive-world-progress-v5` while data is v9. Works; rename only with a migration |
| Geography overlap | Oracle Park (−880, −610) and Chase Center (−878, −598) are **12 m apart** — beacons/meshes overlap. Real-world they're ~1 km apart; nudge Chase Center south |
| `game-loop.ts` size | 1,450+ lines; nav, fuel, parking, streaming, HUD publish all inline. Split per system before adding more |
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

## Pass 3 (Nov 2026) — console feel + Tokyo polish

| Item | Status |
|------|--------|
| Console-feel (pause, gamepad RT/LT, frame cap) | Shipped #106 + `test:playtest` |
| Chase camera Bullet +Z + self-raycast skip | Fixed; playtest dot check |
| Tokyo FF fleet (8 landmarks → 8 cars) | `tokyo-ff-cars.ts` + `test:wiring` |
| CI City Nights | `test:wiring`, `test:playtest`, `test:tokyo` in workflow |

_Pass 2: boot crash fixes, typecheck gate, layout fix, headless smoke. Prior pass covered Telegraph / Caldecott / Orinda / Concord / Walnut Creek / Martinez geography._

## Pass 4 (Nov 2026) — UX, ground, Game Finish merge (PR #114)

| Area | Status | Notes |
|------|--------|--------|
| **Map UI** | Shipped | `BayMap.tsx` — freeways, districts, hubs; corner minimap + large Map tab |
| **HUD tabs** | Shipped | **Drive / Map / Cars / More**; legacy `#hud` hidden when React shell mounts |
| **Fleet / GLB** | Shipped | Starter + background Kenney preload; **Cars** tab `requestVehicleSwap` when slow |
| **3D ground** | Partial | Heightmapped `build-bay-ground.ts` (visual); flat physics slab + streets for handling |
| **Tokyo** | Shipped | 8 landmarks → 8 FF cars; heightfield visuals; `test:wiring` + `test:tokyo` |
| **Game Finish D2–D3** (from `main`) | On branch | Street rep, Nitro Zone HUD, I-80 ghost rival, chapters 1–3 chain |
| **Cars tab density** | Watch | Fleet picker + Records + Safehouse after merge — busier than “fleet only” |
| **CI** | Fragile | Headless Chrome playtests need mph/Δ thresholds (not fixed physics) |
| **World art** | Open | City blocks still procedural boxes; EarthNG-style meshes not in scope |
| **Docs drift** | Open | `DRIVE_WORLD_STATUS.md` still lists “Garage” tab name; code says **Cars** |

**Automated gates (local, Nov 2026):** `npm run test:city-nights` pass on `cursor/tokyo-bonus-fc6d`.

**Still P2 from pass 2:** Oracle/Chase 12 m overlap, `game-loop` monolith, no Vitest in `drive-world/`, empty `public/music/`.
