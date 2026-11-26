# awesome-gamedev-agent-skills (upstream skills library)

Upstream **[gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills)** — **79 Agent Skills** + a **router** for Godot, Unity, Unreal, Phaser, PixiJS, three.js, and more (Apache-2.0). Fits Tortuca alongside [Claude Code Game Studios](../claude-code-game-studios/) (process/QA) and Iris `AGENTS.md` guardrails.

## Bootstrap (local clone, gitignored)

```bash
npm run gamedev-skills:bootstrap
```

Path: `tools/awesome-gamedev-agent-skills/upstream/`. Refresh: `GAMEDEV_SKILLS_PULL=1 npm run gamedev-skills:bootstrap`

## Install into Cursor / Claude Code (on your machine)

Does **not** run inside Netlify or the PWA. From any folder:

```bash
npx skills add gamedev-skills/awesome-gamedev-agent-skills -a cursor
```

Node **22.20+** required. Use `--list` first, or `-a claude-code` for Claude. Smaller install: router + `web-engines` only — see upstream `docs/INSTALLATION.md`.

## Tortuca / PlayCanvas mapping

There is **no PlayCanvas skill**. Tortuca (`drive-world/`, `flight-nemulator/`) is closest to **three.js + GLB** skills. See [CHERRY_PICK.md](./CHERRY_PICK.md).

## IRIS guardrails

Skills must not weaken session gates, `safeFact`, or secrets policy. CC0 / owned assets only per [`VANTAGEGAMES_STUDIO_DIRECTION.md`](../../docs/VANTAGEGAMES_STUDIO_DIRECTION.md).