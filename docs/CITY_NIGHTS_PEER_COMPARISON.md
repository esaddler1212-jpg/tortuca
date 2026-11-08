# City Nights — peer comparison (browser scope)

City Nights is a **browser PlayCanvas** night-drive RPG across the Bay Area. This doc compares what we ship today against **Car Parking Multiplayer 2 (CPM2)**, **Forza Horizon** (6-era expectations), and **Midnight Club: Los Angeles / Remix**—without implying we should clone desktop/console budgets.

## Feature matrix (high level)

| Area | City Nights (now) | CPM2 | Forza Horizon | Midnight Club LA |
|------|-------------------|------|---------------|------------------|
| Platform | Web (PWA) | Mobile + PC | Console/PC/cloud | Console (Remix on current gen) |
| World scale | Bay + terrain strips + interiors-lite | Large multiplayer open maps | Huge licensed open world | LA + freeways, dense city |
| Progression | Chapters, regions, garage, collectibles | Level/parts, social parking | Festival stars, story, seasonal | Rep tiers, clubs, events |
| Social | Solo (cloud save) | **Core**: rooms, trade, voice | Drivatars, convoy, online | Online races, open world sync |
| Driving feel | Arcade physics, nitro, Waymo intro | Simulation-lean parking/drive | Horizon arcade + assists | High-speed arcade, traffic |
| Content cadence | Missions, landmarks, taco trucks, journal | User lots, liveries, RP | Live seasons, playlist | Remix pack style expansions |
| Photo / share | Photo mode, vistas | Screenshots | Forza Hub photos | Limited era-typical |
| Audio | Procedural + ACE-Step hooks | Licensed-lite / user | Licensed radio stations | Licensed + DJ |

## Where City Nights is strong

- **Instant play** in the browser with a full HUD, map, garage, and mission stack—no store install.
- **Bay-specific fantasy**: Vallejo estate → SFO → Marin → East Bay, tuned to real geography and night mood.
- **Console-feel layer** (gamepad glyphs, pause-as-menu, frame cap, cloud progress) aimed at Xbox habits without a native port.
- **Unlockable Tokyo bonus** (all Bay cars + regions → SFO flight → Haneda): a **Remix-style** second map without shipping a second SKU.

## Gaps vs peers (prioritized for browser)

1. **Rep / tier stakes** — MC and Horizon hinge on rising stakes (rep, festival level). We have miles and missions but no single “street rank” meter driving unlock rhythm.
2. **Flash events** — MC “meet here now” and Horizon showcase convoys. We have landmark sprints and courier lines; adding **short competitive sprints** (ghost or async time) would close the loop.
3. **Traffic & density** — MC LA traffic is iconic; our world is intentionally sparse for WebGL. Future: lightweight traffic lanes on freeways only.
4. **Multiplayer** — CPM2’s reason to return daily. Out of scope unless we add a **room code** sync layer (positions only).
5. **Tuning depth** — CPM2 parts/suspension; Horizon upgrades. We have paint, glow, and vehicle catalog swaps—consider **handling presets** per car before full tuning UI.
6. **Zone / nitro spectacle** — MC Remix “Zone” speed blur. Our nitro is functional; a **post-FX burst** on nitro would read closer to MC.
7. **Playlist races** — Horizon’s structured race set. Our **chapter missions** are closest; adding a **circuit roster** (3–5 marked routes) would match player expectations from FH.

## Audit notes (this pass)

- Chase camera collision raycast ignored the **player’s own collider**, clamping follow distance to ~2.8 m—fixed by excluding the vehicle entity (and Tokyo ground) from occluders.
- Console-feel branch: render cap via `renderNextFrame`, pause uses `timeScale` + drive lock, gamepad RT/LT no longer overwritten by `VehicleControls`.
- Tokyo unlock: **every catalog vehicle except Shuto Night Runner** + **all six regions** → pink **SFO gate** → **F** or **D-pad ↑** to board.

## Recommended next slices (hours-scale, browser-safe)

| Slice | Effort | Peer echo |
|-------|--------|-----------|
| Street rep meter tied to region % | Medium | MC rep |
| 5 ghost time trials on freeway segments | Medium | FH rivals |
| Freeway traffic drones (no AI pathing) | Medium | MC traffic feel |
| Nitro Zone post-FX + camera FOV punch | Small | MC Zone |
| Async leaderboard blob per sprint id | Medium | CPM2 boards |

## Tests

- `drive-world`: `npm run test:playtest` (console feel + chase cam)
- `drive-world`: `npm run test:tokyo` (unlock gate, flight, landmarks, return)
- Repo root: `npm run test:os` before merge
