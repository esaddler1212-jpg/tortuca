# UnrealClaude — what to borrow

## Worth using

| Pattern | Apply when |
|---------|------------|
| **Project `CLAUDE.md`** | Any UE5 Tortuga / open-world native port — architecture, GAS, naming |
| **MCP tool categories** | Inspiration for structured editor automation (actors, levels, assets) — compare with PlayCanvas editor APIs only conceptually |
| **`unreal_get_ue_context`** | UE 5.7 doc snippets on demand — reduce hallucinated API in Claude Code sessions |
| **Permission-gated script run** | Mirror “deny by default” for dangerous MCP tools (see AGENTS.md server-tool policy) |

## Tortuca mapping

| Stack | Tooling |
|-------|---------|
| City Nights / Flight Nemulator | PlayCanvas + Vite; smoke: `drive-world/scripts/smoke-boot.mjs` |
| Unreal Tortuga / film | UnrealClaude in editor + optional MCP on **localhost:3000** (trusted machine only) |

## Do not

- Vendor `UnrealClaude/` binaries into this git repo.
- Point Netlify / Iris at Unreal MCP (no `0.0.0.0` exposure).
- Assume UnrealClaude replaces Cursor Cloud agents on PlayCanvas — different engine.

## PlayCanvas bridge (optional future)

If you add a local PlayCanvas editor helper, steal **session persistence** and **tool-router** ideas from upstream `ue5-mcp-bridge` (standalone tests with Vitest) — not the Unreal-specific tools.
