# VantageGames studio direction (product north star)

Captured from owner Q&A (2026-11-26). Paperclip owns **tasks**; this file + git own **truth** for builds and QA.

## Eight decisions

| # | Choice | Implication |
|---|--------|-------------|
| 1 | **Visuals** (next ~2 weeks) | Prioritize Kiln + couch visual pass; gameplay tasks stay small/local |
| 2 | **First Cloud task: Skyring `bw-s3-room`** | Ship room-goal live smoke before other agent work |
| 3 | **Paperclip primary** | Create issues from `tools/paperclip/`; complete in Tortuca + `game-studio:task` |
| 4 | **Canonical play URL: vantagegames1** | Family QA on https://vantagegames1.netlify.app (`/console/…`); not Alfred `/` |
| 5 | **Third game: prototype yes** | **Trustfund** heir title — research → thin slice (reuse City Nights drive + heat) |
| 6 | **Multiplayer: local only** | Ghost boards = localStorage; no live rooms / shared servers in scope |
| 7 | **Art: CC0 only** | `install-free-packs.sh` + catalog; no paid marketplace commits |
| 8 | **Audience: family boys** | Console-first couch pass, Iris games hub, no student PII in fixtures |

## Two-site rule (important)

| Site | Role |
|------|------|
| **vantagegames1** | Where boys play (static, offline Battleworld bundle, City Nights build) |
| **alfred2** (or preview) | Where **room-goal / lattice** Netlify Functions live |

Skyring’s smoke script exercises **API on Alfred**; Gatekeeper’s couch pass exercises **play on vantagegames1**. See [`VANTAGE_GAMES_DEPLOY.md`](./VANTAGE_GAMES_DEPLOY.md).

## Active sprint

See `shared/game-studio-tasks.json` (`sprintId`). Rebalance with:

```bash
npm run game-studio:task -- --id <taskId> --status done --note "…"
```

## Trustfund prototype (season 3)

Start point: [`drive-world/research/findings/2026-11-22-son-of-a-billionaire-inspiration.md`](../drive-world/research/findings/2026-11-22-son-of-a-billionaire-inspiration.md).

**MVP slice (when pulled):** call sign **Trustfund**, `drive-world/` fork or feature flag, one **wealth meter** + heat interaction, no new Netlify scope.