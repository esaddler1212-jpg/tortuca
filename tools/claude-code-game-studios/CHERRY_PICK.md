# Claude Code Game Studios → Tortuca

## Recommended rigor

In a Game Studios `project.yaml`, set **`modes.rigor: minimal`** for City Nights-style iteration — their own benchmarks show extra GDD docs don’t improve playtest scores.

## Skills that map to Tortuca today

| Upstream skill | Tortuca equivalent |
|----------------|-------------------|
| `/smoke-check` | `cd drive-world && npm run test:smoke` (and `flight-nemulator`) |
| `/perf-profile` | Bay quality presets, `hub-streaming.ts`, draw-call audit in `docs/CITY_NIGHTS_AUDIT.md` |
| `/regression-suite` | Root `npm run test:os` before PR |
| `/playtest-report` | GitHub issues (`city-nights` label) + personal playbook |
| `/team-polish` | HUD tab drawer, mission board, traffic/weather toggles |
| `/code-review` | Cursor PR / Bugbot when you ask |

## Skills worth copying (optional)

If you maintain a personal fork under `upstream/`, copy only these into a **local** `.claude/skills/` (not committed unless E wants them in Tortuca):

- `smoke-check`, `perf-profile`, `playtest-report`, `gate-check`
- Templates: `hud-design`, `accessibility` → align with `drive-world/src/hud/`

## Engine agents

Use **Godot/Unity/Unreal specialist sets** only in engine-specific repos. For `drive-world/`, rely on PlayCanvas + existing research findings under `drive-world/research/`.

## Hooks

Upstream git hooks expect **their** `project.yaml` at repo root. Running full hook install inside Tortuca may conflict with Iris hooks — **do not** run their install script on the whole monorepo without review.

## Evidence folder pattern

Their “launch game + screenshot before closing story” rule fits manual QA: save captures to `/opt/cursor/artifacts/` or `drive-world/research/findings/` when playtesting.
