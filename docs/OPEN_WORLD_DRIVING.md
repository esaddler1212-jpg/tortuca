# Open-world driving game (Forza Horizon × Midnight Club)

Browser-first driving on **PlayCanvas** + **Ammo raycast vehicle** physics. Runnable prototype: [`drive-world/`](../drive-world/).

## North-star blends

| Pillar | Forza Horizon | Midnight Club | Our browser scope |
|--------|---------------|---------------|-------------------|
| World | Huge biome map, discovery | City freeway grid, shortcuts | **Streaming tiles** + fog horizon; start with 400×400 m flat |
| Driving | Simulation-lean arcade | Arcade grip, speed reward | **Raycast vehicle** → tune per class |
| Progression | Festival, car collection | Pink slips, unlock kits | Meta in Netlify Blobs / local save later |
| Social | Convoys, shared world | Street races, crews | Optional WebRTC / room codes (phase 3) |
| Audio | Engine layers, radio | Licensed-ish station feel | Web Audio + procedural engine (phase 2) |

## Repo layout

```
drive-world/          Vite + PlayCanvas prototype (WASD, chase cam, speed HUD)
docs/PLAYCANVAS_*.md  Org catalog + install scripts
```

## Phased roadmap

### Phase 0 — Drivable core (done in prototype)

- [x] Ammo WASM + `vehicle.js` raycast setup
- [x] Large ground + runway stripes
- [x] Chase camera + mph HUD
- [ ] Handbrake / drift assist tuning

### Phase 1 — “Open world” feel (Horizon exploration)

- Heightmap terrain or tiled glTF districts (2–4 km² playable)
- Chunk loader: activate colliders/render within radius of car
- Minimap + GPS line to events
- Day/night + simple weather (fog/rain shader)
- Traffic: spline-following NPCs with simple avoidance

### Phase 2 — Midnight Club energy

- Boost / nitrous and risk-reward police heat (optional)
- Quick race queues at map pins
- Car upgrade garage (grip, top speed, looks)
- Split-screen or async ghosts (recorded spline replay)

### Phase 3 — Production

- Licensed or original car meshes (glTF), LODs
- Netcode: authoritative server or host peer for 8-player cruise
- Deploy: separate Netlify site or `public/drive/` with SPA redirect exception

## Technical choices

| Concern | Recommendation |
|---------|------------------|
| Engine | `playcanvas` npm (WebGL2/WebGPU) |
| Vehicle | Engine [`vehicle.js`](https://github.com/playcanvas/engine/blob/main/scripts/physics/vehicle.js) — same as official physics example |
| World size | Grid of chunks; only 3×3 active; recycle like Minecraft |
| Assets | Blender → glTF; roads in Blender or splines + extrude |
| Tools | `npx skills add playcanvas/skills` for agent-assisted scene work |

## Run locally

```bash
cd drive-world
npm install
npm run dev
```

## Content you’ll need to decide

1. **Setting** — SoCal freeways (MC) vs coastal festival map (FH) vs fictional “Bay Area night”?
2. **Camera** — Chase only, or cockpit toggle?
3. **Multiplayer** — cruise-only first, or ranked races day one?
4. **Art pipeline** — low-poly stylized (faster) vs photoreal glTF cars?

Answer those and we can lock Phase 1 chunk size and first district layout.
