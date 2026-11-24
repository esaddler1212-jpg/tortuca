# Hero / villain GLB sources (Battleworld)

Runtime path: `flight-nemulator/public/models/heroes/<hero-id>.glb` (`hero-gltf-paths.ts`). Missing file → procedural box fallback.

## Shipped in git

| Hero id | File | Source |
|---------|------|--------|
| `tin-aviator`, `solar-apex`, `wall-crawler` | Procedural | `npm run build:glb` |
| `emerald-pilot` | `emerald-pilot.glb` | [Kenney Mini Characters](https://kenney.nl/assets/mini-characters) — `character-male-b` (CC0) |
| `storm-hammer` | `storm-hammer.glb` | Kenney Mini Characters — `character-male-c` (CC0) |
| `chrome-sage` | `chrome-sage.glb` | Kenney Mini Characters — `character-female-c` (CC0) |
| `jade-architect` | `jade-architect.glb` | Kenney Mini — `character-male-a` |
| `garnet-brawler` | `garnet-brawler.glb` | Kenney Mini — `character-male-d` |
| `spectrum-artist` | `spectrum-artist.glb` | Kenney Mini — `character-female-a` |
| `ki-sage` | `ki-sage.glb` | Kenney Mini — `character-female-d` |
| `time-blade` | `time-blade.glb` | Kenney Mini — `character-male-e` |

Refresh dev copies:

```bash
bash tools/gamedev-resources/install-free-packs.sh --hero-minis
```

## More CC0 characters (manual)

| Pack | URL | Notes |
|------|-----|--------|
| Kenney Mini Characters | https://opengameart.org/content/mini-characters | 40× animated GLBs |
| Quaternius Universal Base | https://quaternius.com/packs/universalbasecharacters.html | Humanoid rig, glTF |
| Blockbench export | [`BLOCKBENCH_WORKFLOW.md`](./BLOCKBENCH_WORKFLOW.md) | Best for codename silhouettes |

Always add a line to `flight-nemulator/public/models/CREDITS.md`.