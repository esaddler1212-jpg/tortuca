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

Generate **instrumental** night-driving beds → encode **OGG/MP3** → drop in [`drive-world/public/music/`](../../drive-world/public/music/). Details: [CHERRY_PICK.md](./CHERRY_PICK.md).
