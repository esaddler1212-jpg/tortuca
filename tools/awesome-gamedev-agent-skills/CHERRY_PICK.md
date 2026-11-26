# awesome-gamedev-agent-skills → Tortuca (PlayCanvas)

## Router + PlayCanvas gap

The upstream **router** fingerprints `package.json` / engine files. It does **not** list PlayCanvas. For Tortuca browser games, **tell the agent explicitly**:

> Engine: PlayCanvas (WebGL). Use three.js GLTF + asset discipline skills as reference only — implement in PlayCanvas APIs under `drive-world/` or `flight-nemulator/`.

Load upstream **`router/SKILL.md`** for task classification (genre, save-systems, prototype-fast), then swap engine steps for PlayCanvas patterns in [`drive-world/CLAUDE.md`](../../drive-world/CLAUDE.md).

## Skills worth using on Tortuca

| Upstream skill | Tortuca use |
|----------------|-------------|
| `router` | Task → discipline/genre pick before coding |
| `threejs-gltf-loading` | GLB import, animation clips (heroes/villains) |
| `threejs-materials-lighting` | Lighting parity ideas → PlayCanvas materials |
| `create-game-assets` | Art direction brief + CC0 workflow (aligns with **Kiln**) |
| `prototype-fast` | Day-sized slices; minimal GDD |
| `game-docs` | Optional; default **minimal** rigor |
| `itch-publish` / `steam-publish` | Out of scope until a shipping target exists |

Do **not** install Unity/Godot/Unreal bundles into Tortuca agent context unless you open a separate engine repo.

## Tortuca commands (still canonical)

| Upstream idea | Tortuca |
|---------------|---------|
| Smoke | `cd drive-world && npm run test:smoke` · `npm run test:flight-nemulator` |
| Full gate | `npm run test:os` |
| Visuals CC0 | `bash tools/gamedev-resources/install-free-packs.sh --hero-minis` |
| Studio tasks | `shared/game-studio-tasks.json` · Paperclip |

## Studio roles → skills

| Developer | Suggested upstream focus |
|-----------|-------------------------|
| **Kiln** | `create-game-assets`, three.js GLTF |
| **Nightshift** | `prototype-fast`, Phaser arcade physics *patterns* (port to PlayCanvas) |
| **Skyring** | `threejs-scene-setup`, genre combat skills as design refs |
| **Gatekeeper** | upstream does not replace `test:os`; use Game Studios `/smoke-check` too |

## Copy vs `npx skills add`

- **Recommended:** `npx skills add gamedev-skills/awesome-gamedev-agent-skills -a cursor` on your dev machine (updates stay upstream).
- **Selective copy:** symlink or copy individual `skills/**/SKILL.md` into `.cursor/skills/` only when you want a pinned subset — do not commit upstream wholesale into Tortuca git.