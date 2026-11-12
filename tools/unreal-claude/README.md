# UnrealClaude (UE 5.7 + Claude Code)

Upstream **[Natfii/UnrealClaude](https://github.com/Natfii/UnrealClaude)** — editor plugin + MCP bridge for Unreal Engine **5.7** (MIT). City Nights / Flight Nemulator stay **PlayCanvas in the browser**; this is for **Unreal** Tortuga or native prototypes.

## Reference clone

```bash
npm run unreal-claude:bootstrap
```

Path: `tools/unreal-claude/upstream/` (**gitignored**). The repo is large (~380 MB); shallow clone for docs and build instructions only.

## Real install (on your UE machine)

Follow upstream README: `--recurse-submodules`, `RunUAT BuildPlugin`, copy to `YourProject/Plugins/UnrealClaude`, `npm install` in `Resources/mcp-bridge`, authenticate `claude auth login`.

Tortuca does **not** commit the built plugin.

## Tortuca use

See [CHERRY_PICK.md](./CHERRY_PICK.md) — MCP workflow, `CLAUDE.md` in UE projects, and what **not** to merge into `drive-world/`.
