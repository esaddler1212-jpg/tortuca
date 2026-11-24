# Couch / TV visual pass (15–30 min)

One-shot verification after tiers, installs, or art PRs. Pair with [`VISUAL_UPGRADE_TIERS.md`](./VISUAL_UPGRADE_TIERS.md).

## 1. Install (once per machine)

```bash
bash tools/gamedev-resources/install-free-packs.sh --all --city-glb-full \
  --pbr-decks --nature-glb --roads-glb --suburban-glb --building-pbr
```

Cars + sample heroes are **already in git** (`kenney/*.glb`, `heroes/emerald-pilot.glb`, …). Use `--car-kit-full` only to refresh from Kenney’s zip.

## 2. City Nights settings (Tier 0 + 6)

- **Console / TV** or **Lush nights**
- **Coastal weather** on
- **Traffic** on
- **Vice ’86 neon read** on (Settings → lights up storefronts + extra freeway drones on Lush/Console)

## 3. Battleworld settings

- Graphics **Medium / High**
- Hero panel arc details collapsed (default)

## 4. Drive loop (Bay manifest)

From Vallejo safehouse, hit all **six** anchors in `shared/art-district-manifest.json` — confirm procedural kits + optional Kenney rings when packs installed.

## 5. Fly loop

Pick `emerald-pilot`, `storm-hammer`, or `chrome-sage` — confirm Kenney mini GLB silhouettes (not only boxes). City skyline if `kenney-city/` present.

## 6. Automated gate (before PR)

```bash
npm run test:visual-tiers && npm run test:geo-anchor
cd drive-world && npm run build && npm run test:vallejo-art && npm run test:playtest
cd ../flight-nemulator && npm run build && npm run test:battleworld
```

Optional polish prompts: [`GAME_POLISH_VICE86_PROMPTS.md`](./GAME_POLISH_VICE86_PROMPTS.md).