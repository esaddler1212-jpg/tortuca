# Open-world driving — big map, no speed limit

Browser open world (**City Nights**): one large Bay map, drive as fast as you want, plus optional CPM-style loops. Runnable: [`drive-world/`](../drive-world/). Current scope and priorities: [`CITY_NIGHTS_PLAYBOOK.md`](./CITY_NIGHTS_PLAYBOOK.md).

## Product focus

| In | Out (for now) |
|----|-----|
| Huge continuous world you can roam | Multiplayer, pink slips |
| Arcade raycast car that keeps pulling | Day/night cycle (night-only art direction) |
| Optional loops: parking, drag, drift, time attack, landmark sprints, sideshow meets, courier | Mandatory race queues |
| Speed-trap heat + light chaser at heat ≥ 4 | Full police pursuit AI |
| Freeway + hub street traffic, coastal rain | Account-linked saves (Iris) |

## Bay Area layout (reference map)

The world follows the usual **Bay Area macro regions** (same mental model as the standard regional map):

| Region (reference map) | In-game district | Freeway touchpoint |
|------------------------|------------------|-------------------|
| **San Francisco** | `DISTRICTS.sf` | I-80 / US-101 junction (west) |
| **Marin** (North Bay) | `DISTRICTS.marin` | Golden Gate north shore |
| **East Bay** | `DISTRICTS.eastBay` | I-80, I-880 north end |
| **Vallejo / Solano** | `DISTRICTS.vallejo` | I-80 north |
| **Peninsula** | `DISTRICTS.peninsula` | US-101 south |
| **South Bay** | `DISTRICTS.southBay` | US-101 / I-880 |

**Axes:** +X east, +Z north. Scale is compressed (whole bay ~5 km edge-to-edge, not real-world miles).

**Drivable spines:** `FREEWAY_I80`, `FREEWAY_101`, `FREEWAY_880` in [`world-config.ts`](../drive-world/src/world-config.ts) — bay loop with elevated **Bay Bridge** section on I-80.

**Landmarks:** mock low-poly stacks per city — see [`BAY_AREA_LANDMARKS.md`](./BAY_AREA_LANDMARKS.md).

## Progression loop

1. **SFO airport** — cinematic **Waymo** prologue (drone → passenger camera, skippable) along **101 → I-80** to the **Vallejo estate**.
2. **Estate** — choose 1 of 4 **garage starters** (Cruiser, Sport, Ute, Drifter).
3. **Chapter 1** — one pinned objective: find the **Vallejo taco truck + any Vallejo landmark**. That opens Bay fast travel, city search, and Land here.
4. **Regions** — in each macro region, **taco truck + any landmark** unlocks that region’s signature car and safehouse.
5. **More cars** — parking stars, activity goals, district sideshow meets, homage tokens, and craft shards (see `vehicle-catalog.ts`).
6. **Garage** — swap rides and tune paint, handling, camber, spoiler, exhaust, dyno. Save data is v9 under the `drive-world-progress-v5` storage key. Deploy: [`CITY_NIGHTS_DEPLOY.md`](./CITY_NIGHTS_DEPLOY.md).

Gap checklist: [`DRIVE_WORLD_STATUS.md`](./DRIVE_WORLD_STATUS.md).

See [`waymo-ride.ts`](../drive-world/src/waymo-ride.ts), [`landmark-registry.ts`](../drive-world/src/landmark-registry.ts), [`vehicle-catalog.ts`](../drive-world/src/vehicle-catalog.ts).

## Repo layout

```
drive-world/
  world-config.ts       districts + FREEWAY_ROUTES
  build-freeway.ts      drivable decks (all routes)
  build-districts.ts    procedural blocks + signs + lamps
  build-landmarks.ts    iconic mock buildings / bridges
  build-mission-sites.ts  SFO terminal, safehouse, beacons
  game-loop.ts          car pick, safehouse, landmark unlocks
  landmark-registry.ts  visit radii + unlock ids
  vehicle-catalog.ts    starters + Bay Area unlocks
  build-bay.ts          bay water
```

## Phased roadmap

### Phase 0 — Drivable core

- [x] Raycast vehicle + chase cam + mph HUD
- [x] SF bay loop (80 / 101 / 880)
- [x] Six macro districts + mock landmarks
- [ ] Ramp meshes so deck elevation matches ground at every merge
- [ ] Cockpit cam toggle

### Phase 1 — **Big map**

- Chunk streaming if entity count grows
- Heightmap ground matching freeway grade everywhere
- glTF swap for landmark meshes (optional)

### Phase 2 — Feel at speed

- Engine pitch from speed, night fog tuned like Karl
- Water shimmer / shore decals

### Phase 3 — Ship

- Separate Netlify site; save last position

## Run locally

```bash
cd drive-world
npm install
npm run dev
```

**WASD / arrows** — full throttle allowed.

## Art direction (locked)

- **Low-poly Bay Area at night** — fog, sodium lights, International Orange bridge decks
- Full reference-map coverage at compressed scale; landmarks are recognizable silhouettes, not geospatially exact
