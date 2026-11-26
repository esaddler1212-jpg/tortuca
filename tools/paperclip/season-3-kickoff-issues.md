# Paperclip issues — sprint `season-3-kickoff`

Create one **issue per row** in Paperclip, assign to the matching agent, paste the **body** block. Tortuca source of truth: `shared/game-studio-tasks.json`.

## Woodhouse — `wh-s3-01`

**Title:** Season-3 standup — Paperclip status reports

**Body:** Confirm every VantageGames developer filed an `on_track` responsibility report for their active task. Block duplicate Cursor agents on the same task id. Repo: tortuca `main`. Close when all seven tasks show `active` in Team → Game studio.

## Nightshift — `cn-s3-ghost`

**Title:** Async ghost sprint leaderboards (local top-3)

**Body:** Implement local-only leaderboard per ghost circuit; HUD shows top 3 without server. Verify: `cd drive-world && npm run test:wiring` and extend playtest if needed. Then `npm run game-studio:task -- --id cn-s3-ghost --status done --note "…"`.

## Skyring — `bw-s3-room`

**Title:** Room-goal live POST smoke

**Body:** Add `scripts/smoke-battleworld-room-goal.mjs` using `DEPLOY_PRIME_URL` (or env override). Document in `docs/BROWSER_VISUAL_DEPLOY.md`. Complete: `game-studio:task --id bw-s3-room --status done`.

## Kiln — `kiln-s3-tier2`

**Title:** Tier-2 visual gap audit

**Body:** Write `drive-world/research/findings/2026-11-26-tier2-visual.md` comparing shipped assets to `docs/VISUAL_UPGRADE_TIERS.md` for CN + BW.

## Mixdown — `mix-s3-loud`

**Title:** ACE + Tokyo bed loudness audit

**Body:** Update music loudness targets in `docs/CITY_NIGHTS_CONSOLE_FEEL.md`; no secrets in fixtures.

## Gatekeeper — `gate-s3-couch`

**Title:** Couch pass on production preview

**Body:** Run `docs/COUCH_PASS_VISUAL.md` on latest Netlify preview; save notes to `drive-world/research/findings/*-couch-season3.md`.

## Lattice — `lat-s3-wire`

**Title:** Preview env for lattice + room-goal POST

**Body:** Extend `docs/BROWSER_VISUAL_DEPLOY.md` with env table (`DEPLOY_PRIME_URL`, session cookie). Keep `npm run test:vantage-production` green.