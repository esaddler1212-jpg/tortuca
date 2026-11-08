# Open-world driving — big map, no speed limit

Browser sandbox: **one large map**, **drive as fast as you want**, no races, events, traffic gimmicks, or progression gates. Runnable prototype: [`drive-world/`](../drive-world/).

## Product focus

| In | Out |
|----|-----|
| Huge continuous world you can roam | Checkpoints, festivals, race queues |
| Arcade raycast car that keeps pulling | Police heat, pink slips, unlock trees |
| Speed HUD, chase cam, open throttle | NPC traffic (unless you add it later for atmosphere) |
| Later: terrain, biomes, loops, tunnels | Multiplayer requirements at v1 |

Think **endless highway / island loop** vibes, not a career mode.

## Repo layout

```
drive-world/          PlayCanvas + Ammo prototype (≈4 km × 4 km flat, cross highways)
docs/OPEN_WORLD_*     This doc
```

Prototype scale: **`WORLD_HALF_M = 2000`** (see `drive-world/src/world-config.ts`) — about **4 km** per side. Fog pushes the horizon; streaming comes in Phase 1 for 10×–50× larger worlds.

## Phased roadmap

### Phase 0 — Drivable core (in progress)

- [x] Raycast vehicle + chase cam + mph HUD
- [x] Multi-km flat world + cross highways + centre dashes
- [x] High `maxEngineForce` — no code-enforced top speed
- [ ] Handbrake / slide tuning (optional feel, not competition)
- [ ] Cockpit cam toggle

### Phase 1 — **Big map** (the real goal)

- **Chunk streaming** — load/unload ground + road meshes in a ring around the car (8–16 km²+ total)
- Heightmap or modular glTF tiles (coast, hills, long bridges)
- Biome tint + sky only (no collectibles required)
- Warp to origin if you leave the playable border or fall through terrain
- Optional **minimap** (position only, no pins)

### Phase 2 — Feel at speed

- Engine pitch from RPM / speed (Web Audio)
- Motion blur or FOV widen slightly with mph
- Better car glTF + wheel sync
- Rolling hills and banked turns that reward flat-out driving

### Phase 3 — Ship

- Deploy standalone site (Netlify) or `public/drive/` with SPA redirect skip
- Mobile touch controls overlay
- Save last spawn position locally

## Technical choices

| Concern | Approach |
|---------|----------|
| Engine | `playcanvas` |
| Car | [`vehicle.js`](https://github.com/playcanvas/engine/blob/main/scripts/physics/vehicle.js) (Ammo raycast) |
| World size | Single static collider today; **chunks** for production scale |
| Performance | Activate only nearby chunk colliders/render; lower shadow distance per chunk |

## Run locally

```bash
cd drive-world
npm install
npm run dev
```

**WASD / arrows** — full throttle allowed.

## Art direction (locked)

- **Low-poly Bay Area at night** — Karl-the-fog palette, sodium streetlights, International Orange bridge accents
- **Geography (stylised)** — bay on **+Z (east)**; hills rise toward **−Z (west)**; downtown stacks near origin; water + bridge meshes in `build-bay.ts`
- **Freeways** — cross arterials (101 / 80-ish); no events, just drive
- Code: `night-palette.ts`, `bay-terrain.ts`, `build-city.ts`, `build-bay.ts`

## Map shape (still open)

1. **Layout** — cross highways through dense blocks (current) vs ring freeway around the core?
2. **Terrain** — stay flat for max speed vs add gentle hills at the map edge?
