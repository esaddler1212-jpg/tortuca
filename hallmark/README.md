# Hallmark (design skill) — Tortuca companion

This folder does **not** ship [Hallmark](https://github.com/Nutlope/hallmark) inside the IRIS PWA. Hallmark is an **agent design skill** (Cursor, Claude Code, Codex, OpenCode) that pushes UI work away from generic “AI slop” patterns. IRIS only documents it and offers a **shallow clone helper** — the clone lives in `hallmark/hallmark/` and is **gitignored**.

## What it is

- **Upstream:** [Nutlope/hallmark](https://github.com/Nutlope/hallmark) · **Site:** [usehallmark.com](https://www.usehallmark.com)
- Themes, gates, and optional browser checks (`sloplint --render` needs Puppeteer + Chrome per upstream README).
- **Not** the same as [REA](https://github.com/morluto/rea): Hallmark = **design craft** for new UI; REA = **reverse engineering** existing software.

## Quick start

### A. Install the skill (usual path)

Requires Node 18+. From any directory:

```bash
npx skills add nutlope/hallmark -g --agent cursor
```

Omit `-g` to install only in the current project. See [upstream Install](https://github.com/Nutlope/hallmark#install) for Claude Code / Codex-only flags and plugin options.

Invoke in chat: `/hallmark <prompt>` or ask the agent to use Hallmark.

### B. Local clone (optional — browse themes / run scripts)

```bash
cd hallmark
chmod +x bootstrap.sh   # once, if needed
./bootstrap.sh
```

**Update** an existing clone: `HALLMARK_PULL=1 ./bootstrap.sh`

Then you can run the clone’s installer: `node hallmark/hallmark/skills/hallmark/scripts/install.mjs` (path after bootstrap).

## IRIS relation

- **IRIS** does not load Hallmark at runtime. This is **developer tooling** for Cursor sessions on Tortuca.
- The **Woodhouse** card links here for discoverability (same pattern as Voicebox, optional n8n docs).

## Safety

- Browser-rendered checks need **Chrome + puppeteer-core** if you use `--render`; without them, static checks still run (upstream README).
- Do not paste Family Purpose / student PII into public showcases unless you intend to.

`hallmark/hallmark/` is **gitignored** so the clone never lands in Tortuca commits.
