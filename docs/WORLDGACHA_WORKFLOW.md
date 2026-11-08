# World Gacha → Flight Nemulator

[World Gacha](https://tools.oyasumi-gamedev.com/worldgacha/) (おやすみゲーム開発部 / MIYADAIKU) rolls **fictional towns** (castle towns, hill cities, waterfall cities, etc.), lets you sketch on the top-down map, place the camera, and **export PNG + GLB**.

## License (summary)

From [tools terms](https://oyasumi-gamedev.com/tools/terms/):

- You **may** use exports inside games and commercial projects.
- You **may not** redistribute exports as asset packs, templates, or stock.
- Credit is optional; games often list tools in credits (e.g. `World Gacha (MIYADAIKU)`).

Do not scrape, reverse-engineer, or bulk-download the tool. Export only what you need by hand.

## Drop a town into the sandbox

1. Open World Gacha → roll / edit → **書き出し** → download **GLB**.
2. Copy the file to `flight-nemulator/public/models/worldgacha/`.
3. Edit `flight-nemulator/public/models/worldgacha/index.json`:

| Field | Purpose |
|-------|---------|
| `centerpiece` | Main GLB filename (e.g. `waterfall-town.glb`) |
| `scale` | Uniform scale (start around `0.3`–`1`; towns are large) |
| `offset` | `[x, y, z]` world position (hero starts near district homes ~ origin) |
| `yRotation` | Degrees around Y |
| `files` | Optional extra GLBs placed at satellite slots (max 3 by quality tier) |

4. `cd flight-nemulator && npm run dev` — towns load with the procedural city (`build-city-worldgacha.ts`).

## Tips in the tool

- Match **飛ぶ速さ** (fly speed) to hero flight feel (~80–190 m/s in UI).
- Export with a wide lens if you want a skyline backdrop; use a tight shot for a single destructible block (future: mark colliders).

## Related

- Catalog entry: `gamedev-resources/tortuca-playcanvas.json` (`oyasumi-world-gacha`)
- Real-world blocks: [Location Scout](https://tools.oyasumi-gamedev.com/) (OSM — separate tool, attribution required on publish)
