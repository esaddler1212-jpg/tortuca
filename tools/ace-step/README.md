# ACE-Step 1.5 (local music generation)

Upstream **[ace-step/ACE-Step-1.5](https://github.com/ace-step/ACE-Step-1.5)** — open-source music foundation model (MIT). Tortuca does **not** vendor weights or Python envs in git.

## Clone

```bash
npm run ace-step:bootstrap
```

Clone path: `tools/ace-step/upstream/` (**gitignored**).

Updates: `ACE_STEP_PULL=1 npm run ace-step:bootstrap`

## Install (inside clone)

Requires **Python 3.11–3.12** and a **CUDA / MPS** GPU for reasonable speed (CPU works but is slow).

```bash
cd tools/ace-step/upstream
# upstream: curl uv installer, then:
uv sync
uv run acestep          # Gradio http://localhost:7860
# or: uv run acestep-api  # REST http://localhost:8001
```

macOS portable zip and Windows package: see upstream `docs/en/INSTALL.md`. No GPU: [acemusic.ai](https://acemusic.ai) for trials, then export files you’re allowed to use locally.

## Tortuca use

```bash
# GPU Mac/PC (best): in upstream clone — uv run acestep-api
npm run ace-step:city-nights

# No API running (CI / cloud): synth placeholder loops, still updates playlist
npm run ace-step:city-nights -- --fallback-only
```

Prompts live in `city-nights-tracks.json`. Details: [CHERRY_PICK.md](./CHERRY_PICK.md).
