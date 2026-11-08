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
| [Higgsfield CLI](https://github.com/higgsfield-ai/cli) | Scene stills, fallback video chain |
| `ffmpeg` / `ffprobe` | Frame extraction and encoding |
| Python 3 + Pillow | Optional knockout / mobile canvases |
| Codex CLI (optional) | Scene stills via ChatGPT `image_gen` instead of Higgsfield credits |

**Not the same repo:** [higgsfield-ai/higgsfield](https://github.com/higgsfield-ai/higgsfield) is an older **GPU / LLM training** framework (`pip install higgsfield==0.0.3`). Scroll-world needs the **generation CLI** above (`higgsfield generate create …`).

### Higgsfield setup (scroll-world Step 0)

1. Install CLI (no sudo):

   ```bash
   curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh -s -- --prefix=$HOME/.local
   export PATH="$HOME/.local/bin:$PATH"
   higgsfield version
   ```

2. Authenticate (interactive browser OAuth — run locally):

   ```bash
   higgsfield auth login
   higgsfield workspace list
   higgsfield workspace set <workspace_id>
   higgsfield account status
   ```

3. Agent skills: this repo vendors **`.claude/skills/higgsfield-generate/`** from [higgsfield-ai/skills](https://github.com/higgsfield-ai/skills) (scroll-world’s SKILL.md points here). Full plugin install: `npx skills add higgsfield-ai/skills` or see `INSTALL_FOR_AGENTS.md` upstream.

Cloud agents can install the CLI binary but **cannot** complete `auth login` for you — run generations on a machine where you are signed in.

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
