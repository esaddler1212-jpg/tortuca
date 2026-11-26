# Paste into Paperclip — VantageGames `season-3-kickoff`

Repo: **https://github.com/esaddler1212-jpg/tortuca** · branch **main**  
Play URL: **https://vantagegames1.netlify.app/console/**  
API smoke base: **https://alfred2.netlify.app** (not vantagegames1)

---

## Company goal (one paragraph)

Ship a **family-ready visual pass** on **vantagegames1** using **CC0-only** assets (hero/minis install first), keep **City Nights + Battleworld** stable at **100%** finish-program, document **Trustfund** as a **spec-only** third title (no Trustfund code this sprint), and verify **Battleworld room-goal** with `npm run smoke:room-goal` against **production alfred2**. Paperclip tracks tasks; **git** (`shared/game-studio-tasks.json`) is the source of truth—close issues when verify lines pass and Tortuca commits land.

---

## Seven issues (titles — create one agent assignee each)

| # | Agent (Paperclip hire name) | Issue title |
|---|----------------------------|-------------|
| 1 | **Woodhouse** | `season-3` Mirror sprint board to Tortuca `game-studio-tasks.json` |
| 2 | **Nightshift** | `trust-s3-01` Trustfund MVP spec (doc only — no gameplay code) |
| 3 | **Skyring** | `bw-s3-room` Room-goal smoke on **alfred2.netlify.app** |
| 4 | **Kiln** | `kiln-s3-cc0` CC0 hero/minis install + vantagegames1 visual findings |
| 5 | **Mixdown** | `mix-s3-loud` Family-safe ACE + Tokyo bed levels in console-feel doc |
| 6 | **Gatekeeper** | `gate-s3-couch` Couch pass notes — **vantagegames1** console path |
| 7 | **Lattice** | `lat-s3-wire` Two-site doc: play vantagegames1 vs API alfred2 |

**Optional backlog (do not start in Paperclip yet):** `cn-s3-ghost` local leaderboards — **pending** in git.

---

## Issue body template (repeat per issue)

```text
Sprint: season-3-kickoff
Verify: (copy from shared/game-studio-tasks.json for this task id)
Docs: docs/VANTAGEGAMES_STUDIO_DIRECTION.md

Rules:
- CC0 / install-free-packs only — no paid marketplace assets in git
- Family audience — vantagegames1 couch QA, no PII in fixtures
- Trustfund is spec-only this sprint (Nightshift)
- When done in Tortuca: npm run game-studio:task -- --id <id> --status done --note "…"
```

### Skyring verify line (paste into issue 3)

`npm run smoke:room-goal` with default `https://alfred2.netlify.app/api/battleworld-room-goal` — green GET+POST+tally increase.

### Kiln verify line (paste into issue 4)

From repo root: `bash tools/gamedev-resources/install-free-packs.sh --hero-minis` (or documented flags you approve), then commit `drive-world/research/findings/*-cc0-vantagegames1.md` only — **do not commit** redistributable pack blobs if policy says so.

---

## Responsibility report reminder (Paperclip)

When each agent checks in, status should be **on_track / at_risk / behind** with one line **why** (Paperclip responsibility report format), not just “done.”