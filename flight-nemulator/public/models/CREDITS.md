# Credits

## Procedural / first-party

Default buildings, heroes, and drones are procedural primitives in `flight-nemulator/src/`.

| `heroes/tin-aviator.glb` | Tortuca first-party low-poly pilot mesh (`npm run build:hero-glb`) | CC0 |
| `heroes/wall-crawler.glb` | Procedural hero mesh #3 (`npm run build:hero-glb`) | CC0 |
| `heroes/*.glb` (11 bundled ids) | Procedural CC0 (`npm run build:hero-glb`) | CC0 |
| `villains/*.glb` (5 bundled ids) | Procedural CC0 (`npm run build:nemesis-glb`) | CC0 |

## Optional CC0 (install scripts)

| Pack | Source | License |
|------|--------|---------|
| Interface Sounds | [Kenney](https://kenney.nl/assets/interface-sounds) | CC0 |
| City Kit GLBs | [Kenney City Kit Commercial](https://kenney.nl/assets/city-kit-commercial) | CC0 |
| Modular Buildings | [Kenney Modular Buildings](https://kenney.nl/assets/modular-buildings) | CC0 |
| Mini Characters (emerald-pilot, storm-hammer, chrome-sage, jade-architect, garnet-brawler, spectrum-artist, ki-sage, time-blade) | [Kenney Mini Characters](https://kenney.nl/assets/mini-characters) | CC0 |
| World Gacha fallback skyline (`worldgacha/bay-modular-*.glb`) | Kenney Modular Buildings (same kit as `kenney-modular/`) | CC0 |

Install: `bash tools/gamedev-resources/install-free-packs.sh --all` from repo root. Hero refresh: `--hero-minis`. Tier guide: [`docs/VISUAL_UPGRADE_TIERS.md`](../../../docs/VISUAL_UPGRADE_TIERS.md), [`docs/HERO_GLB_SOURCES.md`](../../../docs/HERO_GLB_SOURCES.md).

## Optional Oyasumi World Gacha (manual export)

Towns from [World Gacha](https://tools.oyasumi-gamedev.com/worldgacha/) — use in-game per [tool terms](https://oyasumi-gamedev.com/tools/terms/); do not commit redistributable asset packs. See [`docs/WORLDGACHA_WORKFLOW.md`](../../../docs/WORLDGACHA_WORKFLOW.md).

## HUD icons (Battleworld)

| File | Source | License |
|------|--------|---------|
| `public/hud/icons/*.svg` | Tortuca first-party glyphs (swap with [game-icons.net](https://game-icons.net) CC BY downloads) | CC0 / CC BY per file |

When using **game-icons.net** assets, credit authors on [game-icons.net/about.html](https://game-icons.net/about.html) (CC BY 3.0).

## External indexes (not bundled)

Curated free sources: [`gamedev-resources/tortuca-playcanvas.json`](../../../gamedev-resources/tortuca-playcanvas.json). Marketplaces: [`docs/GAMEDEV_MARKETPLACES.md`](../../../docs/GAMEDEV_MARKETPLACES.md).
