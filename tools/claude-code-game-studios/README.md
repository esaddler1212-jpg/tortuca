# Claude Code Game Studios

Upstream **[Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)** — 49 agents, 74 slash-command skills, hooks, and templates for structured game dev in Claude Code (MIT).

Tortuca **keeps** AGENTS.md guardrails on Iris and uses **minimal** studio rigor for PlayCanvas games in-repo.

## Reference clone

```bash
npm run game-studios:bootstrap
```

Path: `tools/claude-code-game-studios/upstream/` (**gitignored**).

## Using it with City Nights / Flight Nemulator

Do **not** replace Tortuca’s tree with a Game Studios template project. Either:

1. **Sidecar workspace** — clone upstream as its own game repo for a UE/Godot title, or  
2. **Skills-only** — open Claude Code at Tortuca repo root and manually run borrowed slash commands after copying selected skills (see [CHERRY_PICK.md](./CHERRY_PICK.md)).

Start here in Tortuca: [`drive-world/CLAUDE.md`](../../drive-world/CLAUDE.md) when working under `drive-world/`.
