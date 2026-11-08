# scroll-world (Tortuca / IRIS)

Upstream skill: [oso95/scroll-world](https://github.com/oso95/scroll-world).

This repo vendors the skill at `.claude/skills/scroll-world/` so Cursor, Claude Code, and other `SKILL.md` agents can build a **scroll-scrubbed “fly through the world”** marketing page (Emons-style isometric flight, no hard cuts between scenes).

## When to use

- A public landing that is **not** the signed-in IRIS PWA — separate static page or host.
- Do **not** fold third-party marketplace bundles into the main app shell unless product asks ([AGENTS.md](../AGENTS.md)).

## Prerequisites (on your machine)

| Tool | Role |
|------|------|
| [Monid CLI](https://monid.ai) | Default video chain (Seedance 2.0), pay-per-clip |
| [Higgsfield CLI](https://higgsfield.ai) | Scene stills, fallback video chain (`higgsfield auth login`) |
| `ffmpeg` / `ffprobe` | Frame extraction and encoding |
| Python 3 + Pillow | Optional knockout / mobile canvases |
| Codex CLI (optional) | Scene stills via ChatGPT `image_gen` instead of Higgsfield credits |

This Cloud Agent environment has `ffmpeg` only — generations must run where Monid/Higgsfield are authenticated.

## Invoke the skill

In Cursor or Claude Code, refer to `.claude/skills/scroll-world/SKILL.md`, or ask for a scroll-through world landing and follow **Step 1 — Interview** (subject, brand kit, scene order, mobile chain, budget).

Outputs live **per project** (not in git): `scrub-engine.js`, `index.html` config, and `assets/` video stills/clips.

## Serving from Netlify (later)

The main app uses a SPA fallback (`/*` → `index.html`). A standalone scroll page needs either:

- Its own Netlify site, or
- Files under `public/world/` plus a **specific** redirect rule **before** the SPA catch-all in `netlify.toml`.

## References in the skill

- `references/prompts.md` — intake + Higgsfield prompt templates  
- `references/pipeline.md` — generate → frames → connectors → encode  
- `references/scrub-engine.js` — portable scrub engine  
- `references/index-template.html` — minimal mount example  
