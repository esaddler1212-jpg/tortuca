# Drive World — status

Stack: **PlayCanvas** + **React HUD** · `drive-world-progress-v5`

## Shipped (this wave)

| Feature | Notes |
|---------|--------|
| Headlights / taillights / brake glow | `vehicle-lights.ts` |
| Nitro | **Shift** or gamepad shoulder |
| Gamepad | Left stick + triggers |
| React minimap, nav, landmarks, settings | Volume, fog, traffic toggle |
| Chase / cockpit / **drone** (C) | |
| **Photo mode** (P) | Free-fly cam; hide main HUD |
| Waymo skip + **fast travel** | Unlocked regions only, at safehouse |
| Collectibles | Unlock bonus paints (Warriors, Giants, etc.) |
| Speed traps | Personal best mph per trap |
| Scenic routes | Checkpoint badges (Marin coast, Skyline) |
| Per-car **odometer + top speed** | Saved per vehicle id |
| Garage: ride height, underglow, tint, rims, handling presets | Grip / Drift / Comfort |
| I-280 freeway, **Lombard** switchbacks | |
| **6 new landmarks** | Lombard, Painted Ladies, Wharf, Oracle Park, Lake Merritt, … |
| Ambient freeway traffic | Toggle in settings |
| Regional **Karl fog** | SF/Marin denser |
| Freeway ramps | Prior pass |

## Still optional / not done

| Item | Notes |
|------|--------|
| **glTF hero cars** | Drop models in `drive-world/public/models/` |
| **Cloud save** | Local only; tie to Tortuca Google session later |
| Full **day/night cycle** | Night-only art direction kept |
| World streaming / LOD | |
| True heightmap terrain | |

Deploy: [`DRIVE_WORLD_DEPLOY.md`](./DRIVE_WORLD_DEPLOY.md)
