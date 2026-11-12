# Cherry-pick map: JARVIS-OS-V.2 → Tortuca / Iris

We **clone upstream locally** (`npm run jarvis-os-v2:bootstrap`) and **borrow patterns**, not the Gemini stack inside Netlify Iris.

## Do not merge into Iris

| Upstream piece | Why we keep it separate |
| --- | --- |
| Gemini Live + `GEMINI_API_KEY` | Iris uses **Claude** on `/api/ask` with `AGENTS.md` guardrails |
| PyQt desktop shell | IRIS is a **PWA**; local UI stays optional |
| FastAPI + Next multi-user web | Different auth, memory, and threat model than Google session + Blobs |
| Desktop browser/file/messaging tools | No Family Purpose / student data through unreviewed desktop agents |

Production Iris stays on **Netlify**. Local Gemini Jarvis is an **experiment** beside [`alfred-jarvis/`](../alfred-jarvis/) (OpenJarvis / Alfred on the iMac).

## Patterns worth adopting

| Idea from upstream | Tortuca equivalent / action |
| --- | --- |
| **`jarvis --self-test`** (side-effect-safe capability audit) | Keep **`npm run test:os`** as the Iris gate; after you set up the clone, run **`npm run jarvis-os-v2:self-test`** on the Mac before trusting desktop tools |
| **Docker Compose** local API + web + Postgres + Redis | Same shape as future **Coolify** stack in [`docs/SERVER_PLAN.md`](../docs/SERVER_PLAN.md) — use upstream `docker-compose.yml` as a reference, not a copy into this repo |
| **Presentation studio** (editable `.pptx` from sources) | Future **Hub / ECS** export idea; no PWA change until explicitly requested |
| **Encrypted per-user API keys** (hosted web mode) | Reference only if we ever add a second hosted assistant; today keys live in **Netlify env** only |
| **Detachable panels / modular UI** | Inspiration for Iris HUD modules only — implement in React when designed, not by embedding PyQt |

## What we actually took into this repo

- Companion **`jarvis-os-v2/`** (this folder): bootstrap, verify script, docs, Claude skill.
- **Woodhouse** discoverability link (optional tools footnote).
- **`alfred-jarvis/README.md`** cross-link so OpenJarvis Alfred and Gemini Jarvis aren’t confused.

## Upstream setup (your Mac)

```bash
npm run jarvis-os-v2:bootstrap
cd jarvis-os-v2/JARVIS-OS-V.2
python scripts/setup_jarvis.py
# .env → GEMINI_API_KEY
jarvis
```

Optional web stack: see upstream README `docker compose up --build`.

## Git cherry-pick (single commits)

If you want one upstream commit inside Tortuca (rare):

```bash
cd jarvis-os-v2/JARVIS-OS-V.2
git log --oneline -20
# From repo root, after adding their remote: git cherry-pick <sha>
```

Prefer **copying a small script or doc** into Tortuca with attribution over blind `cherry-pick` across unrelated histories.
