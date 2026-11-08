# City Nights — audit (Nov 2026)

Compressed **Bay Area night sandbox** in `drive-world/`. Not a AAA open world; a single-player browser prototype with progression, collectibles, and bonus vehicles.

## What you have today

| Layer | Shipped |
|-------|---------|
| **World** | ~5.2 km half-extent, **15 landmark hubs** (per-city mini maps), monument street loops, plaza pads, freeways between hubs, procedural blocks inside hubs only, ramps, Lombard, traffic toggle |
| **Progression** | Waymo intro → garage starter → **taco truck + any landmark per region** → regional car + preset safehouse |
| **Extra vehicles** | Aerial (scenic + rotor token), legend homages (collectibles), Kenney + CC0 glTF |
| **Systems** | Nitro, gamepad, touch pad (ground), scenic routes, speed traps, fast travel, photo mode, drone/chase/cockpit cam, fog, garage tuning |
| **Persistence** | `localStorage` save **v6** (`tacoTrucksFound`, pose, stats, unlocks) — same key as v5 |
| **Deploy** | Separate Netlify site, folder `drive-world`, product name **City Nights** |

## Geography you asked about

| Place | In game? |
|-------|----------|
| **Telegraph Ave** (Berkeley → Oakland) | Yes — landmark + shop strip meshes |
| **Emeryville (Bay St / Shellmound / Pixar)** | Yes — hub, **Pixar campus** landmark, taco truck |
| **Chase Center (SF)** | Yes — Mission Bay arena landmark + nearby taco truck |
| **Caldecott / tunnel side** | Yes — portal landmark + **Hwy 24** spine to Concord |
| **Orinda** | Yes — hillside / theatre beacon |
| **Concord** | Yes — plaza landmark (east along 24) |
| **Walnut Creek** | Yes — Broadway-style block |
| **Martinez** | Yes — shoreline pier + tank-farm hint |

East Bay district bounds were nudged east/north (`eastBay` in `world-config.ts`) so Concord / Martinez sit inside the same region bucket for unlocks.

**Still abstract:** Richmond, Antioch, Pleasant Hill strip malls, real BART geometry, tunnel interiors (portals only). Local grids are Manhattan-style between blocks, not surveyed OSM geometry.

## Vs typical open-world driving games

Compared to *Forza Horizon*, *TDU*, *Need for Speed*, *Cruis’n* / arcade roamers:

| Common feature | City Nights |
|----------------|-------------|
| Large authored world | Procedural + landmark art |
| Story missions | Waymo + landmark / scenic goals only |
| AI traffic / police | Ambient freeway traffic (simple); no chases |
| Damage / repair | None |
| Day/night cycle | Night-only |
| Weather | Regional fog slider |
| Interiors | None |
| Multiplayer | None |
| Map / GPS voice | React minimap + nav hint |
| Photo / social | Photo mode (local) |
| Licensed cars | CC0 + homages |
| Cloud save | Sync key + Netlify Blobs |
| Controller remap | Partial (gamepad + defaults) |
| Mobile flight | Touch drive only on ground |

**Shipped (cruise wave):** vistas + journal, multi-camera cruise, procedural + playlist music, photo cruise card, heat siren flavor, Night Coil autopilot presets (chill/tour/scenic), Waymo memory replay at garage, CI build, HUD code-split chunks.

**Still optional:** full Tortuca Google-session cloud, police chase AI, user MP3 playlist content (drop files in `public/music/`).

## Cleanup backlog (engineering)

| Item | Severity | Notes |
|------|----------|-------|
| `npm run typecheck` | Medium | ~15 errors (`ScriptComponent` typing, `Vec3` import in `build-districts`, `GameSettings` in listener, progress migrate types) |
| Bundle size ~1.55 MB JS | Medium | Lazy-load vehicle GLBs; code-split HUD |
| Event namespace `drive-world:*` | Low | Rename to `city-nights:*` only if you accept breaking bookmarks/docs |
| Duplicate deploy docs | Low | `DRIVE_WORLD_DEPLOY.md` → pointer; prefer `CITY_NIGHTS_DEPLOY.md` |
| `main.ts` `options.mouse = undefined` | Low | Type error; use proper Mouse or omit |
| No CI gate for `drive-world/` | Low | Optional `npm run build` job on path filter |
| Internal package name `drive-world` | OK | Keeps Netlify base dir stable |

## Content balance note

East Bay has **13** landmarks; region unlock no longer requires visiting all of them — only the **Emeryville taco truck** plus **one** landmark anywhere in the district.

## Player-facing gaps to watch on Chromebook

- First load heavy (WebGL + assets).
- Flight needs keyboard / gamepad for altitude.
- Saves are per-browser, not Google account.

---

_Last updated with Telegraph / Caldecott / Orinda / Concord / Walnut Creek / Martinez pass._
