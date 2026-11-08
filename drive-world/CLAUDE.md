# City Nights (PlayCanvas)

Open-world Bay night driving in `drive-world/`. **Standalone** Netlify app — not Iris auth.

## Commands

```bash
npm ci
npm run build
npm run test:smoke   # headless Chrome; CHROME_PATH if needed
```

Repo gate before PR: from Tortuca root, `npm run test:os`.

## Guardrails

Repo root [`AGENTS.md`](../AGENTS.md) applies when touching `netlify/functions` or shared Iris code. For game-only work: no secrets in client, no weakening save/auth patterns documented in playbook.

## Docs

- Playbook: [`docs/CITY_NIGHTS_PLAYBOOK.md`](../docs/CITY_NIGHTS_PLAYBOOK.md)
- Status / audit: [`docs/DRIVE_WORLD_STATUS.md`](../docs/DRIVE_WORLD_STATUS.md), [`docs/CITY_NIGHTS_AUDIT.md`](../docs/CITY_NIGHTS_AUDIT.md)
- External tools (music, studio skills, UE, A2F): [`docs/UPSTREAM_GAME_TOOLCHAIN.md`](../docs/UPSTREAM_GAME_TOOLCHAIN.md)

## Optional Claude Code Game Studios

Use **`modes.rigor: minimal`**. Map `/smoke-check` → `npm run test:smoke`. See [`tools/claude-code-game-studios/CHERRY_PICK.md`](../tools/claude-code-game-studios/CHERRY_PICK.md).
