# OpenGame (nexu-io/opengame)

Upstream **[OpenGame](https://github.com/nexu-io/opengame)** — Super Game Agent studio (25 HTML5 templates, MCP playtest/validate, Three.js + 2D). Apache-2.0.

**Tortuca uses PlayCanvas** for City Nights and Battleworld; OpenGame is a **process and peer-reference** clone, not a runtime dependency.

## Bootstrap

```bash
npm run opengame:bootstrap
```

Clone path: `tools/opengame/upstream/` (**gitignored**).

## What to read first

| Tortuca need | OpenGame path |
|--------------|----------------|
| QA gates & P2 stop-loss | `skills/openmotion-game/references/game-gates.md` |
| Feel (hit-stop, input hygiene) | `skills/openmotion-game/references/game-feel-craft.md` |
| Racing peer (near-miss boost) | `templates/games/neon-drift/` |
| Offline verify harness idea | `templates/games/tidebreaker/verify-offline.cjs` |
| 3D courier timer missions | `templates/games/skyline-courier/DESIGN.md` |
| Agent skill (optional global install) | `npx skills add https://github.com/nexu-io/opengame/tree/skills --skill opengame` |

Cherry-pick map: [`OPENGAME_CHERRY_PICK.md`](./OPENGAME_CHERRY_PICK.md)  
Gap review vs VantageGames: [`docs/OPENGAME_VANTAGEGAMES_REVIEW.md`](../../docs/OPENGAME_VANTAGEGAMES_REVIEW.md)