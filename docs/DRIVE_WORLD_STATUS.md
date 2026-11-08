# Drive World — status & gaps

Runnable prototype: [`drive-world/`](../drive-world/). This is an honest checklist of what exists vs what is still thin or missing.

## Shipped in the prototype

| Area | Status |
|------|--------|
| Full Bay macro map (6 districts, 3 freeways) | In |
| Low-poly night landmarks + beacons | In |
| Waymo intro ride → Vallejo safehouse | In |
| Garage starters + 6 regional unlock cars | In |
| Landmark visits + per-region completion | In |
| Safehouse garage swap | In |
| **Per-car customization** (paint, glow, power, grip) at safehouse | In |
| `localStorage` progress (v3) | In |
| Raycast vehicle + chase cam + mph HUD | In |

Customize: [`vehicle-customization.ts`](../drive-world/src/vehicle-customization.ts); saved per vehicle id in progress.

## Missing or partial (high impact)

| Gap | Why it matters |
|-----|----------------|
| **Freeway on/off ramps** | Deck height ≠ ground at merges; car can fall through or clip. |
| **World streaming / LOD** | Whole map loads at once; fine for demo, not for mobile or huge art pass. |
| **Cockpit / map camera** | Only chase cam; no minimap or navigation to next landmark. |
| **Audio** | No engine, wind, Waymo chime, or landmark sting. |
| **Save last pose** | Reload drops you at safehouse, not where you parked. |
| **Netlify / production deploy** | Not wired as its own site on tortuca yet (see Phase 3 in [`OPEN_WORLD_DRIVING.md`](./OPEN_WORLD_DRIVING.md)). |
| **Real car meshes** | Blocks are placeholders; no glTF bodies or wheel art. |
| **Mobile touch UI** | PlayCanvas vehicle supports buttons; no on-screen steer/pedals in HTML. |

## Missing or partial (medium / polish)

| Gap | Notes |
|-----|--------|
| Waymo **skip** or chapter select | Ride is fixed length every new game. |
| Landmark checklist UI | Progress is one long HUD line; no map pins. |
| Collision on landmark meshes | Mostly visual; drivable only on freeways + ground. |
| Terrain ↔ freeway alignment | `hillOffsetM` vs deck `y` still approximate. |
| Water / shore animation | Flat emissive plane. |
| Regional car uniqueness | Unlock cars differ in tuning/paint defaults, same block mesh. |
| Customization depth | No wheel size, ride height, decals, or cabin tint (easy follow-ups). |

## Suggested next slices (if you prioritize)

1. **Minimap + “next landmark”** — biggest QoL for regional grind.
2. **Cockpit cam toggle** — cheap camera path in `game-loop.ts`.
3. **Engine audio tied to `vehicle.speed`** — feel at “no speed cap”.
4. **Deploy `drive-world` to Netlify** — preview URL for sharing.
5. **Ramp meshes** at I-80 / 101 / 880 junctions — fixes the worst physics holes.

## Test locally

```bash
cd drive-world && npm install && npm run dev
```

Customization: pull into the **orange safehouse** yard — garage panel opens; edit paint/sliders → **Apply & refresh**.
