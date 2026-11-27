# OpenGame → Tortuca cherry-pick

Do **not** embed OpenGame Studio or MCP in the Netlify PWA. Use ideas, checklists, and optional local `npm run opengame:bootstrap` for agents on your Mac.

## Adopt (high value)

| OpenGame pattern | Tortuca action |
|------------------|----------------|
| `design/plan.md` + `design/verification.md` + Hard Fails | Add [`docs/CITY_NIGHTS_VERIFICATION.md`](../../docs/CITY_NIGHTS_VERIFICATION.md) + mirror for Battleworld |
| P0 / P1 / P2 + max 3 fix rounds | Already in audits; adopt **P2 cap (5 items)** in completion docs |
| `runSelfTests()` invariants | Future: expose hooks from `drive-world` / `flight-nemulator` playtest only |
| Consolidated playtest (`action` + `screenshot` scripts) | Extend `scripts/playtest-*.mjs` with labeled screenshots to `/opt/cursor/artifacts/` |
| Portrait **390×844** pass | Add to couch QA checklist (`COUCH_PASS_VISUAL.md`) |
| **Neon Drift** near-miss → boost | City Nights optional slice (peer to nitro) — see gap review |
| **Input hygiene** (blur clears keys) | Audit `game-loop` / touch — City Nights partially has this |
| **verify-offline.cjs** (no Chrome) | Inspiration for Vitest on pure modules (`bay-navigation`, sprint board) |

## Reference only

| OpenGame | Why skip in-repo |
|----------|------------------|
| MCP `openmotion_game_*` (12 tools) | Separate server; Iris guardrails |
| Multimodal asset billing / OpenDesign Go | Family CC0 policy |
| WeChat / TikTok export | Out of scope |
| Unity / UE engine agents | PlayCanvas only |
| 25 template full source copy | License/size; link templates instead |

## Install OpenGame skill (optional, user machine)

```bash
npx skills add https://github.com/nexu-io/opengame/tree/skills --skill opengame
```

For Tortuca-specific gates, prefer **`.claude/skills/tortuca-*`** and `npm run test:*-complete`.