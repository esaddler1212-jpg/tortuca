# City Nights × Craft Anything — browser game research

Use **[Craft Anything](https://github.com/storytold/craft-anything)** as Tortuca’s **study engine**: browsers, WebGL games, and PWA shells — with **evidence ids**, not guesswork. Implementation stays in `drive-world/` (PlayCanvas + Vite + React HUD).

Feel pillars (CPM2 × Forza × MC): [`CITY_NIGHTS_FEEL.md`](CITY_NIGHTS_FEEL.md).

## Setup (once per machine)

```bash
bash tools/craft-anything/install.sh --cursor
npm run craft:doctor
```

Restart **Cursor**. Confirm the `craft-anything` MCP tools appear (or run `craft-anything-cli doctor` — `mcp:self-test` should be ok).

Optional coding-agent backends for full **rebuild** loops: `craft-anything-cli ai detect` (not required for investigation-only).

## Project folder

| Path | Purpose |
|------|---------|
| `drive-world/research/city-nights-browser/` | Craft project (`--project`): brief, plan, evidence, journal |
| `drive-world/research/findings/` | **Committed** summaries agents write after a study (markdown only) |
| `drive-world/research/briefs/` | Reusable study prompts |

Register the project path when wiring MCP:

```bash
craft-anything-cli setup --client cursor --yes \
  --project "$(pwd)/drive-world/research/city-nights-browser"
```

## Investigation workflow (agents)

1. **`core_brief_write`** — Question, constraints, done definition (see [`briefs/browser-excellence.md`](../drive-world/research/briefs/browser-excellence.md)).
2. **`enable_toolset`** — At minimum: `browser`, `javascript` (and `web` if listed). Deep mode only when studying **your own** bundles or OSS artifacts in-repo — not commercial game clients.
3. **Study** — Examples:
   - `web_site_open` / `web_site_capture` on **your Netlify City Nights URL** or `http://127.0.0.1:5173` during dev.
   - `web_page_capture` at mobile + desktop widths (Chromebook, iPhone).
   - `web_walkthrough_record` for input → frame pacing (touch pad, nitro, garage).
   - Compare **PlayCanvas** and **MDN** docs pages for physics/audio/mobile patterns (clean-room).
4. **`core_finding_record`** — Each conclusion cites `ev_…` ids.
5. **Ship to Tortuca** — One markdown file in `findings/YYYY-MM-DD-<topic>.md` with:
   - **Recommendations** (concrete files in `drive-world/src/…`)
   - **Evidence table** (id → observation)
   - **Out of scope** (what we will not clone)
6. **`core_handoff_write`** — Next agent picks up here.

Never commit `capture/`, huge screenshots, or third-party assets from Craft projects — only curated findings.

## What to research for “best in browser”

Prioritized checklist for City Nights:

| Topic | Study targets (legal) | Tortuca hook |
|-------|------------------------|--------------|
| **Mobile WebGL** | MDN low-latency canvas; PlayCanvas device docs; your PWA on iPhone | `mobile-platform.ts`, touch HUD, `index.html` meta |
| **Frame budget** | PlayCanvas performance guide; compare LCP on your deploy | `bay-quality.ts`, hub streaming, traffic density |
| **Input** | Pointer events, gamepad standard; your touch pad | `game-input.ts`, `game-bridge.ts` |
| **Audio unlock** | Web Audio autoplay policies | `game-audio.ts`, tap-to-start |
| **Physics feel** | Ammo raycast tuning articles; PlayCanvas vehicle samples | `vehicle.js`, `vehicle-customization.ts` |
| **PWA / offline** | MDN installability; Netlify headers | `netlify.toml`, service worker if any |
| **Racing UX** | OSS HTML5 demos, GDC-style writeups (not cloned assets) | `cpm-scoring.ts`, `drive-feel.ts`, HUD |

## Using findings in development

1. Open finding markdown in Cursor.
2. Implement smallest diff in `drive-world/`.
3. `cd drive-world && npm run build`.
4. Root `npm run test:os` before release.
5. Link finding file in PR description.

## CLI quick reference

```bash
export PATH="$(pwd)/tools/craft-anything/bin:$PATH"
craft-anything-cli doctor
craft-anything-cli commands | head   # all tool ids
# Investigation project (app GUI optional):
craft-anything-cli rebuild - "Not used for Tortuca default"  # requires AI builder
```

## Governance

- **IRIS / Tortuca** guardrails still apply: no secrets in findings, no student PII in captures.
- Commercial games (CPM2, Forza, MC): study **mechanics in prose** from GDC/community writeups or your own notes; use Craft on **web-playable demos you own or that are explicitly OSS**. Homage mechanics in City Nights remain original implementation.
