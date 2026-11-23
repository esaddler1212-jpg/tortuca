# Blockbench → PlayCanvas pipeline

[Blockbench](https://github.com/JannisX11/blockbench) (GPL-3.0 **editor**) is our recommended **low-poly hero / prop** modeler. **Exports you create are yours** per Blockbench’s license FAQ.

## Install (local)

- Download: [blockbench.net](https://www.blockbench.net)
- Or from source: `git clone https://github.com/JannisX11/blockbench.git` → `npm install` → `npm run dev`

We do **not** vendor Blockbench inside Tortuca — only this workflow doc and catalog links.

## Hero model guidelines (Flight Nemulator)

| Setting | Value |
|---------|--------|
| Format | **Generic Model** or **Modded Entity** |
| Scale | ~ human 1.8 m tall; keep under 2k tris for mobile |
| Texture | 64×64 or 128×128 pixel art / flat colors |
| Export | **glTF / `.glb`** with embedded textures |

Export path:

```text
flight-nemulator/public/models/heroes/<codename>.glb
```

Add a line to `flight-nemulator/public/models/CREDITS.md`.

## PlayCanvas import

1. Place `.glb` under `public/models/`.
2. Load with PlayCanvas `Asset` + `ContainerHandler` (see `drive-world/src/vehicle-gltf.ts` pattern).
3. Parent under hero flight entity; keep procedural fallback if load fails.

## Plugins (optional)

- **Animated JavaScript Entity** — simple bobbing flight idle
- **Export optimization** — merge vertices before export

Blockbench plugins may be proprietary; check each plugin license.

## Related catalogs

- [`gamedev-resources/tortuca-playcanvas.json`](../gamedev-resources/tortuca-playcanvas.json)
- [`docs/GAMEDEV_RESOURCES.md`](./GAMEDEV_RESOURCES.md)
