# VantageGames studio on Paperclip

**Product direction:** [`VANTAGEGAMES_STUDIO_DIRECTION.md`](./VANTAGEGAMES_STUDIO_DIRECTION.md) (owner decisions — Paperclip goals should match).

**Completion audit:** [`VANTAGEGAMES_COMPLETION_AUDIT.md`](./VANTAGEGAMES_COMPLETION_AUDIT.md) · Paperclip issues: [`tools/paperclip/completion-audit-issues.md`](../tools/paperclip/completion-audit-issues.md).

**Agent skills:** `npm run gamedev-skills:bootstrap` · [`tools/awesome-gamedev-agent-skills/CHERRY_PICK.md`](../tools/awesome-gamedev-agent-skills/CHERRY_PICK.md).

[Paperclip](https://github.com/paperclipai/paperclip) orchestrates **goals, org chart, tasks, and agent-written status reports**. Tortuca already ships slice progress via `game-finish:report`; this doc defines the **game developer group** to hire in Paperclip and how it maps to the Alfred Team tab.

## The report model (Paperclip)

Paperclip’s **responsibility status report** is a structured heartbeat, not a wall of markdown:

| Field | Rule |
|-------|------|
| **status** | `on_track` · `at_risk` · `behind` · `unknown` |
| **message** | One plain line — *why* (max ~200 chars), e.g. “Tokyo playtest green; next is async ghost boards.” |
| **detail** | Optional few sentences (max ~800 chars) |
| **freshness** | Older than **7 days** reads as stale but still visible |

Source reference: Paperclip `packages/shared/src/responsibility-status-reports.ts`.

Tortuca slice summaries in `shared/game-finish-status.json` → `reports[]` are the **execution log**; Paperclip-style reports are the **health line** per responsibility.

## Goal (paste into Paperclip company)

> **VantageGames on Tortuca:** Keep City Nights (`drive-world/`) and Battleworld (`flight-nemulator/`) shippable on Netlify, 100% on the 24-slice finish program, and honest status in Iris Team.

Budget and approvers: your call in Paperclip; Tortuca caps agent cost in `shared/agentGuardrails.ts` for Iris routes.

## Developer group (hire list)

Canonical roster: `shared/gameStudioDevelopers.ts` (`VANTAGEGAMES_DEVELOPER_GROUP`).

| Agent | Reports to | Repo focus | Verify |
|-------|------------|------------|--------|
| **Woodhouse** | Iris (you) | Program + dedupe | Team / delegate overlap |
| **Nightshift** | Woodhouse | `drive-world/` | `test:city-nights` |
| **Skyring** | Woodhouse | `flight-nemulator/` | `test:flight-nemulator` |
| **Kiln** | Woodhouse | Visual / GLB index | `test:gamedev-resources` |
| **Mixdown** | Woodhouse | Audio beds | `test:game-finish` (cn-d09) |
| **Gatekeeper** | Woodhouse | QA / CI | `VANTAGEGAME_FINISH_GATE=1 test:game-finish`, `test:os` |
| **Lattice** | Woodhouse | Netlify / hub | `test:vantage-production` |

Only **Nightshift** and **Skyring** own `game-finish:report` slices. Others file Paperclip tasks + responsibility reports when their verify command or doc milestone moves.

### Claude Code Game Studios sidecar

Optional upstream agents (49-role kit): `npm run game-studios:bootstrap` → `tools/claude-code-game-studios/upstream/`. Map via `upstreamAgent` on each role; do **not** install their git hooks on the whole Tortuca monorepo — see `tools/claude-code-game-studios/CHERRY_PICK.md`.

## Paperclip setup checklist

1. Clone [paperclipai/paperclip](https://github.com/paperclipai/paperclip.git) and run their quickstart (local or cloud waitlist).
2. Create company goal (above).
3. Create agents matching the table; set **reportsTo** so Nightshift/Skyring/Kiln/… roll up to **Woodhouse**, Woodhouse to you.
4. Assign responsibilities with verify commands from the table; enable **status reports** on each.
5. Connect **Cursor Cloud** (or your harness) adapters per agent; repo URL `esaddler1212-jpg/tortuca`, branch `main`.
6. Import hire prompts from `tools/paperclip/vantagegames-hire-prompts.md` (one block per agent).

## Current sprint (assigned in git)

Sprint **`season-3-kickoff`** lives in `shared/game-studio-tasks.json`. Each developer has an **active** task. Iris includes sprint text in ask context.

```bash
npm run game-studio:task -- --id cn-s3-ghost --status done --note "HUD board shipped"
npm run test:game-studio-tasks
```

Paperclip issue copy: `tools/paperclip/season-3-kickoff-issues.md`.

## Tortuca integration (today)

- **Team → Game studio** card: slice % + Nightshift / Skyring active day.
- **Iris Right now:** `gameFinishContextForAsk()` includes program % and latest `reports[]`.
- **No Paperclip API in Netlify** yet — Paperclip is an external orchestrator; Tortuca stays source of truth in git for slice state.

## Example responsibility reports (season 3)

| Agent | status | message |
|-------|--------|---------|
| Nightshift | on_track | Tokyo and open-world parity gates green; backlog is async ghost leaderboards. |
| Skyring | on_track | Room goal public route wired; live POST dogfood still needs Netlify preview. |
| Gatekeeper | on_track | Finish gate 24/24; test:os is the weekly auditor backstop. |
| Kiln | at_risk | Tier 4 couch assets optional — tier 0–2 packs installed, hero GLBs procedural. |

Update these in Paperclip after deploys; mirror big wins with `npm run game-finish:report` only when a **slice** completes.