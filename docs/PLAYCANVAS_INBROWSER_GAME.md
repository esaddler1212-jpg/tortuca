# PlayCanvas org — in-browser game stack

Catalog of all **[playcanvas](https://github.com/orgs/playcanvas/repositories)** GitHub repositories for building **WebGL / WebGPU / WebXR** games that run in the browser (no install).

**Machine-readable list:** [`playcanvas-org-repos.json`](./playcanvas-org-repos.json) — **82** repos (refresh with `./scripts/fetch-playcanvas-org-repos.sh`).

**Local mirror:** shallow-clone with `./scripts/clone-playcanvas-org.sh`:

| Tier | Repos | Use |
|------|------:|-----|
| `core` | 6 | Engine + scaffold + examples + React / web-components + agent skills |
| `game` | `core` + 16 more | Tweens, 2D physics, Spine, sample game, sync, MCP/stage for agents |
| `all` | 82 | Full org mirror (includes editor, splats, forks, archived) |

Default mirror path: `../playcanvas-org-mirror` next to this checkout.

## Fastest path to a browser game

```bash
npm create playcanvas@latest
# or: npm install playcanvas
```

- **Engine manual:** https://developer.playcanvas.com/user-manual/engine/
- **Live examples:** https://playcanvas.com/examples/ (source: `playcanvas.github.io`)
- **Sample game in org:** [FlappyBird](https://github.com/playcanvas/FlappyBird)

### AI agents (Cursor / Claude / Codex)

```bash
npx skills add playcanvas/skills
```

Skills cover `build-app`, `assemble-scene`, `configure-animation`, perf (`reduce-draw-calls`), etc., for **engine**, **@playcanvas/react**, and **@playcanvas/web-components**.

## Recommended tiers for a video game

### Core (start here)

| Repo | Why |
|------|-----|
| [engine](https://github.com/playcanvas/engine) | Runtime: rendering, physics, audio, input, XR |
| [create-playcanvas](https://github.com/playcanvas/create-playcanvas) | Project scaffold |
| [playcanvas.github.io](https://github.com/playcanvas/playcanvas.github.io) | Runnable examples |
| [skills](https://github.com/playcanvas/skills) | Agent workflows |
| [react](https://github.com/playcanvas/react) | React apps/games |
| [web-components](https://github.com/playcanvas/web-components) | Declarative 3D in HTML |

### Gameplay & tooling (typical 2D/3D title)

| Repo | Why |
|------|-----|
| [playcanvas-tween](https://github.com/playcanvas/playcanvas-tween) | Tweens |
| [playcanvas-p2.js](https://github.com/playcanvas/playcanvas-p2.js) | 2D physics |
| [playcanvas-spine](https://github.com/playcanvas/playcanvas-spine) | Spine animation |
| [playcanvas-webpack](https://github.com/playcanvas/playcanvas-webpack) | Bundler template |
| [playcanvas-editor-ts-template](https://github.com/playcanvas/playcanvas-editor-ts-template) | TypeScript + Editor sync |
| [playcanvas-sync](https://github.com/playcanvas/playcanvas-sync) | Local ↔ playcanvas.com project |
| [awesome-playcanvas](https://github.com/playcanvas/awesome-playcanvas) | Community assets list |
| [FlappyBird](https://github.com/playcanvas/FlappyBird) | Minimal game reference |
| [inspector](https://github.com/playcanvas/inspector) | In-app debug panel |
| [stage](https://github.com/playcanvas/stage) | Agent-facing scene editor |
| [editor-mcp-server](https://github.com/playcanvas/editor-mcp-server) | MCP automation for Editor |
| [vscode-extension](https://github.com/playcanvas/vscode-extension) | Editor in VS Code |
| [developer-site](https://github.com/playcanvas/developer-site) | Docs source |
| [prompts](https://github.com/playcanvas/prompts) | Curated engine prompts |

### Separate from the game runtime (optional)

| Repo | Note |
|------|------|
| [editor](https://github.com/playcanvas/editor) | Visual editor (TypeScript); pairs with cloud projects |
| [model-viewer](https://github.com/playcanvas/model-viewer) | glTF / splat viewer, not a game loop |
| [supersplat](https://github.com/playcanvas/supersplat) | Gaussian splat **authoring** |
| [pcui](https://github.com/playcanvas/pcui) | UI kit for **tools**, not in-game HUD by default |

## Full org inventory (82)

Columns: **archived**, **fork** — prefer active, non-fork repos for new games.

See [`playcanvas-org-repos.json`](./playcanvas-org-repos.json) for `clone_url`, `topics`, `license`, and `pushed_at`.

Top stars (active, game-adjacent):

| Repo | Stars | Description |
|------|------:|-------------|
| engine | 17k+ | Web game engine |
| supersplat | 10k+ | Splat editor (not gameplay) |
| editor | 1.3k+ | Browser editor |
| splat-transform | 1.4k+ | Splat CLI |
| model-viewer | 700+ | Asset viewer |
| pcui | 700+ | Tool UI |
| react | 550+ | React integration |
| awesome-playcanvas | 500+ | Curated list |
| playcanvas-ar | 260+ | Web AR |
| playcanvas-gltf | 100+ | glTF (legacy; in engine now) |

*(Exact star counts change; JSON is refreshed via `fetch-playcanvas-org-repos.sh`.)*

## Open-world driving (active prototype)

See [`OPEN_WORLD_DRIVING.md`](./OPEN_WORLD_DRIVING.md) and run [`drive-world/`](../drive-world/) (`npm run dev`) — raycast car on a ~4 km map, chase cam, mph HUD, no speed cap.

## Tortuca / IRIS

This repo does **not** embed a PlayCanvas canvas in the signed-in PWA unless product asks ([AGENTS.md](../AGENTS.md)). A game can live as:

- A **sibling Vite/PlayCanvas app** deployed on its own Netlify site, or
- A route under `public/` with a **Netlify redirect** before the SPA catch-all (same pattern as scroll-world landings in `docs/SCROLL_WORLD.md`).

## Maintenance

```bash
./scripts/fetch-playcanvas-org-repos.sh    # update JSON from GitHub API
./scripts/clone-playcanvas-org.sh game     # refresh local mirror
```
