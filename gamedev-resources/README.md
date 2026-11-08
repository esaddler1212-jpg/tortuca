# GameDev resources (Tortuca / PlayCanvas)

Curated **100% free** entries from [Kavex/GameDev-Resources](https://github.com/Kavex/GameDev-Resources) that apply to **browser PlayCanvas** buildouts:

- [`drive-world/`](../drive-world/) — City Nights driving
- [`flight-nemulator/`](../flight-nemulator/) — hero flight sandbox

Machine-readable list: [`tortuca-playcanvas.json`](./tortuca-playcanvas.json).

## Sync upstream index

```bash
npm run gamedev-resources:sync
```

Records the pinned upstream commit in `upstream-pin.json` (no vendoring of the full 572-line README).

## Install CC0 packs (optional, not in git)

```bash
bash tools/gamedev-resources/install-free-packs.sh --audio --city-glb
```

- **Kenney Interface Sounds** (CC0) → `flight-nemulator/public/audio/kenney/`
- **Kenney City Kit** (CC0) sample GLBs → `flight-nemulator/public/models/kenney-city/`

Always verify license on each site before shipping.

## License caution

Kavex’s list marks `:free:` but **you must read each site’s license**. We do **not** vendor [Kavex/GameSounds](https://github.com/Kavex/GameSounds) in the game build (repo is **GPL-3.0** — awkward to mix with a static web bundle). Use **Kenney**, **Freesound** (per-sound CC), **FreePD**, etc., instead.

See also [`docs/GAMEDEV_RESOURCES.md`](../docs/GAMEDEV_RESOURCES.md).
