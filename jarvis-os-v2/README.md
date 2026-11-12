# JARVIS-OS-V.2 (Gemini desktop) — Tortuca companion

Upstream **[MAL19INDUSTRIES/JARVIS-OS-V.2](https://github.com/MAL19INDUSTRIES/JARVIS-OS-V.2)** is a **local Gemini Live** assistant (PyQt) plus an optional **FastAPI + Next.js** stack. Tortuca **does not ship it** in the IRIS PWA — we **clone for reference** and [cherry-pick patterns](CHERRY_PICK.md) only.

## Clone

```bash
npm run jarvis-os-v2:bootstrap
```

Updates: `JARVIS_OS_PULL=1 npm run jarvis-os-v2:bootstrap`

The clone lives in `jarvis-os-v2/JARVIS-OS-V.2/` (**gitignored**).

## Install upstream (inside the clone)

Requires **Python 3.11+** and a **Gemini API key**.

```bash
cd jarvis-os-v2/JARVIS-OS-V.2
python scripts/setup_jarvis.py
cp .env.example .env   # set GEMINI_API_KEY
jarvis
```

Capability audit (no live messages / desktop mutations per upstream docs):

```bash
npm run jarvis-os-v2:self-test
```

## vs Iris / alfred-jarvis

| | **JARVIS-OS-V.2** | **Iris (Netlify)** | **[alfred-jarvis](../alfred-jarvis/)** |
| --- | --- | --- | --- |
| Brain | Gemini Live | Claude | OpenJarvis + Claude/Ollama |
| Role | Desktop + optional web product | Phone/iPad command center | iMac Alfred briefings + Woodhouse sync |

See **[CHERRY_PICK.md](CHERRY_PICK.md)** for what to borrow without merging codebases.
