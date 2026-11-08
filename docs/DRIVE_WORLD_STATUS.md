# Drive World — status & gaps

Runnable prototype: [`drive-world/`](../drive-world/). Stack: **PlayCanvas** (world + physics) + **React** (minimap, nav, touch).

## Shipped

| Area | Status |
|------|--------|
| Full Bay map, freeways, landmarks, Waymo intro, regional unlocks | ✅ |
| Safehouse garage + per-car customization (paint, glow, power, grip, wheels) | ✅ |
| **React HUD**: minimap, landmark regions, next-landmark nav | ✅ |
| **Cockpit / chase cam** (C key or button) | ✅ |
| **Skip Waymo** | ✅ |
| **Engine audio** + landmark chime (Web Audio) | ✅ |
| **Save last pose** (v4 `lastPose`) | ✅ |
| **Freeway ramp colliders** (major merges) | ✅ |
| **Touch drive** controls (coarse pointer) | ✅ |
| **Animated bay** emissive | ✅ |
| **Extra landmark collision** (select footings) | ✅ |
| **Regional body bits** (spoiler / wing / rack) | ✅ |
| **Netlify** config in `drive-world/netlify.toml` | ✅ |

Deploy: [`DRIVE_WORLD_DEPLOY.md`](./DRIVE_WORLD_DEPLOY.md).

Progress key: `drive-world-progress-v4`.

## Still thin / future

| Gap | Notes |
|-----|--------|
| **glTF real cars** | Still block meshes; hook PlayCanvas glb loader when art is ready. |
| **World streaming / LOD** | Full scene load; cull distant districts if mobile struggles. |
| **Terrain mesh vs freeway** | Ramps help; heightmap ground still ideal. |
| **Shore decals / better water** | Shader or normal map pass. |
| **Waypoint GPS voice / Missions UI** | React HUD is textual only. |
| **Multiplayer** | Out of scope for sandbox. |

## Run

```bash
cd drive-world && npm install && npm run dev
```
