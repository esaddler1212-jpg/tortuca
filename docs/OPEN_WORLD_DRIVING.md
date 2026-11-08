# Open-world driving — big map, no speed limit

Browser sandbox: **one large map**, **drive as fast as you want**, no races or events. Runnable prototype: [`drive-world/`](../drive-world/).

## Product focus

| In | Out |
|----|-----|
| Huge continuous world you can roam | Checkpoints, festivals, race queues |
| Arcade raycast car that keeps pulling | Police heat, pink slips, unlock trees |
| Speed HUD, chase cam, open throttle | NPC traffic (unless you add it later for atmosphere) |
| Later: terrain, biomes, loops, tunnels | Multiplayer requirements at v1 |

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

1. **SFO airport** — **Waymo** autonomous ride (no driving); it follows **101 → I-80** to the **Vallejo Safehouse**.
2. **Safehouse** — choose 1 of 3 **garage starters** (`Safehouse Cruiser`, `Sport`, `Ute`); you drive from here.
3. **Regions** — visit **every landmark** in a macro region (SF, Marin, East Bay, Vallejo, Peninsula, South Bay) to unlock that **region’s signature car** (6 unlocks).
4. **Garage** — at the safehouse, swap any unlocked ride. Progress: `localStorage` `drive-world-progress-v2`; **New game** restarts the Waymo intro.

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
