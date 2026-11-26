# Claude Code Game Studios — deep dive (Tortuca lens)

Upstream: [Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) (MIT). Local clone: `npm run game-studios:bootstrap` → `tools/claude-code-game-studios/upstream/` (gitignored).

## What the framework is

A **Claude Code operating system for games**, not a game engine:

| Layer | Contents |
|-------|-----------|
| **Lifecycle** | `/start` → `/prototype` → grow with `/dev-story` → `/cut` polish → `/launch-checklist` |
| **Agents (49)** | Leads (game designer, QA lead, audio…), specialists (gameplay, net, TA, writer…), engine packs (Godot/Unity/Unreal) |
| **Skills (74+)** | Slash commands: smoke, regression, sprint, gates, GDD/architecture, team roles |
| **Hooks + `project.yaml`** | Coherence checks, story gates, optional strict QA |
| **Templates** | GDD, HUD, accessibility, agent test specs |

Default path builds **browser prototypes** (`prototypes/<name>/`) then **Vite+TS** production trees — great for greenfield, **not** for dropping onto Tortuca.

## Skill families (what each bucket does)

| Folder | Purpose | Tortuca use |
|--------|---------|-------------|
| **utility/** | `smoke-check`, `regression-suite`, `playtest-report`, `qa-plan`, `release-checklist` | **High** — map to `test:smoke`, `test:os`, artifacts |
| **gate/** | `gate-check` | **High** — before merge / couch pass |
| **analysis/** | `perf-profile`, `scope-check`, `tech-debt`, `code-review` | **Medium** — Bay quality, audits |
| **team/** | `team-polish`, `team-qa`, `team-ui`, `team-audio`… | **Low in-repo** — Paperclip roles already cover this |
| **pipeline/** | `create-epics`, `vertical-slice`, `dev-story` | **Low** — use `game-studio-tasks.json` / Paperclip |
| **authoring/** | `art-bible`, `ux-design`, `quick-design` | **Reference** — align with `CITY_NIGHTS_ART_BRIEF.md` |
| **sprint/** | `sprint-plan`, `retrospective`, `patch-notes` | Optional for human sprints |

## Rigor modes (`project.yaml`)

| `qa.level` | Behavior |
|----------|----------|
| `minimal` | Smoke optional; FAIL advisory — **recommended for VantageGames** |
| `standard` | Smoke before phase transitions |
| `full` | Smoke before every commit |

Tortuca already enforces harder gates via **`npm run test:os`** and game-specific completion gates.

## What we **added** to Tortuca (committed)

| Path | Role |
|------|------|
| [`.claude/skills/tortuca-smoke-check/SKILL.md`](../.claude/skills/tortuca-smoke-check/SKILL.md) | Agent SOP: City Nights + Battleworld smoke |
| [`.claude/skills/tortuca-regression-suite/SKILL.md`](../.claude/skills/tortuca-regression-suite/SKILL.md) | Full monorepo gate |
| [`.claude/skills/tortuca-playtest-report/SKILL.md`](../.claude/skills/tortuca-playtest-report/SKILL.md) | Evidence → findings |
| [`.claude/skills/tortuca-gate-check/SKILL.md`](../.claude/skills/tortuca-gate-check/SKILL.md) | Pre-PR completion gates |
| [`.claude/skills/tortuca-perf-profile/SKILL.md`](../.claude/skills/tortuca-perf-profile/SKILL.md) | Chromebook / TV presets |

## What we **do not** install

- Upstream **git hooks** on Tortuca root (conflicts with Iris / Netlify policy).
- Full **`project.yaml`** studio template (would fight monorepo layout).
- Godot/Unity/Unreal **engine agent packs** unless you open a separate repo.

## Command map (source of truth)

| Upstream idea | Tortuca command |
|---------------|-----------------|
| Smoke | `cd drive-world && npm run test:city-nights` · `cd flight-nemulator && npm run test:battleworld` |
| Regression | `npm run test:os` |
| Completion gates | `npm run test:city-nights-complete` · `npm run test:battleworld-complete` |
| Playtest evidence | `/opt/cursor/artifacts/`, `drive-world/research/findings/` |
| Perf | Bay quality presets; `docs/CITY_NIGHTS_AUDIT.md` lighting caps |

See also: [`tools/claude-code-game-studios/CHERRY_PICK.md`](../tools/claude-code-game-studios/CHERRY_PICK.md), [`UPSTREAM_GAME_TOOLCHAIN.md`](./UPSTREAM_GAME_TOOLCHAIN.md).