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

| Region (reference map) | In-game district | Status |
|------------------------|------------------|--------|
| **San Francisco** (yellow) | `DISTRICTS.sf` — west peninsula, hills | Built |
| **East Bay** (tan) | `DISTRICTS.eastBay` — Oakland side | Built |
| **North Bay / Solano** (blue) | `DISTRICTS.vallejo` — north waterfront | Built |
| **Peninsula** (pink) | — | Future (101 / I-280 south) |
| **South Bay** (green) | — | Future (San José loop) |

**Driving route (built):** **I-80 east** from SF across the **Bay Bridge** (elevated deck) → **Oakland / East Bay** → **I-80 north** to **Vallejo**. Game +X is east, +Z is north. Scale is compressed (~3 km along the freeway, not 16 km).

Spawn in SF on I-80; follow the lit corridor to Vallejo.

## Repo layout

```
drive-world/
  world-config.ts     districts + FREEWAY_ROUTE waypoints
  build-freeway.ts    drivable collision deck
  build-districts.ts  mini cities per region
  build-bay.ts        bay water between peninsula and East Bay
```

## Phased roadmap

### Phase 0 — Drivable core (in progress)

- [x] Raycast vehicle + chase cam + mph HUD
- [x] SF ↔ Vallejo on one freeway (bridge + I-80 north)
- [x] Three mini districts tied to reference regions
- [ ] Ramp meshes so deck elevation matches ground at on-ramps
- [ ] Cockpit cam toggle

### Phase 1 — **Big map** (the real goal)

- Chunk streaming for Peninsula + South Bay + North Bay beyond Vallejo
- Heightmap ground matching freeway grade
- Optional **880 / 101 loop** around the bay (drive-only, no events)

### Phase 2 — Feel at speed

- Engine pitch from speed, night fog tuned like Karl
- glTF landmarks (optional): bridge silhouette, downtown stacks

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

- **Low-poly Bay Area at night** — fog, sodium lights, International Orange bridge deck
- **SF → Vallejo** corridor only; expand other map colors later
