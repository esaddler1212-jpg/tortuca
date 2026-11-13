# OpenWorldJS cherry-pick inventory

Upstream: [obecerra3/OpenWorldJS](https://github.com/obecerra3/OpenWorldJS) (ISC). We **do not** vendor Three.js from that repo. This table tracks every top-level / game file and what we did in Tortuca.

| Path (upstream) | Role | Tortuca disposition |
|-----------------|------|---------------------|
| `README.md` | Project overview | Reference only (this doc) |
| `package.json` / `package-lock.json` | npm metadata | Skip (RequireJS bundle, not our stack) |
| `index.html` / `index.php` | Entry | Skip |
| `style.css` | UI | Skip |
| `deploy.sh` / `local.sh` | hosting | Skip |
| `UserManager.php` / `maze.php` / `messageprotocol.txt` | PHP multiplayer | Skip (Netlify auth model) |
| `genmaze.py` | PNG → `maze.bin` | **Ported** → `tools/openworldjs/genmaze.py` |
| `maze.bin` / `maze.png` | bitmask maze | **Asset** → `drive-world/public/openworldjs/maze.bin` |
| `logo.png` | branding | Skip |
| `js/main.js` | bootstrap | Skip |
| `js/config.js` | Require paths | Skip |
| `js/require.js` | AMD loader | Skip |
| `js/lib/*` | Three, Ammo, Draco, loaders | Skip — we use PlayCanvas + existing Ammo in drive-world |
| `js/shaders/*` | GLSL terrain/water | Reference only (PlayCanvas shaders differ) |
| `js/textures/skybox_*.bmp` | cube sky | Skip (we use `night-palette`) |
| `js/models/*.glb` | Mixamo samples | Skip (license; we use procedural GLBs) |
| `js/game/physics/physics.js` | Ammo wrapper | Skip (PlayCanvas rigidbody) |
| `js/game/physics/ray.js` | debug ray helper | **Pattern** → ground snap (no Three) |
| `js/game/physics/collider.js` | multi-ray collide | Reference for future pedestrian mode |
| `js/game/world/terrain.js` | GPU heightmap | Skip |
| `js/game/world/biomes.js` | biomes | Reference |
| `js/game/world/world.js` / `light.js` | scene setup | Skip |
| `js/game/world/mazeEngine.js` | instanced maze walls | **Ported** → `maze-wall-builder.ts` |
| `js/game/world/heightMapGenerator.js` | height gen | Skip |
| `js/game/player.js` / `camera.js` | character | Skip |
| `js/game/playerInputHandler.js` | input + debug cmds | **Pattern** → `dev-commands.ts` |
| `js/game/renderer.js` / `scene.js` / `game.js` | loop | Skip |
| `js/game/utils/states.js` | anim FSM names | **Ported** → `character-animation-states.ts` |
| `js/game/utils/animator.js` | Three mixer | Reference (future GLB anims) |
| `js/game/utils/utils.js` | constants | Maze constants inlined in maze modules |
| `js/game/utils/*` (debug, time, etc.) | misc | Cherry-pick as needed |
| `js/game/multiplayer/*` | netcode WIP | Skip |

## Integrated modules (PlayCanvas)

- `drive-world/src/openworldjs/maze-bitmap.ts` — decode `maze.bin` bit packing (from `mazeEngine.readMazeFile`)
- `drive-world/src/openworldjs/maze-wall-builder.ts` — merged wall segments (from `mazeEngine.build`)
- `drive-world/src/openworldjs/ground-snap.ts` — terrain height snap via `hillOffsetM`
- `drive-world/src/openworldjs/character-animation-states.ts` — animation state ids
- `drive-world/src/openworldjs/dev-commands.ts` — debug toggles when `?cnDebug=1`
- `drive-world/src/build-openworld-maze.ts` — spawns maze at Vallejo yard (non-Chromebook presets)

## Attribution

When adapting logic, cite OpenWorldJS authors Oscar Becerra and Ben Walker and the upstream repository URL in module headers.
