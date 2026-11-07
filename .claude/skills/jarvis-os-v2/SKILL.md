---
name: jarvis-os-v2
description: >
  Clone MAL19INDUSTRIES/JARVIS-OS-V.2 and cherry-pick patterns for Tortuca without
  merging Gemini into Iris. Use when E asks to set up JARVIS-OS, compare to alfred-jarvis,
  or run jarvis --self-test from the local clone.
---

# JARVIS-OS-V.2 (companion only)

- Bootstrap: `npm run jarvis-os-v2:bootstrap` → `jarvis-os-v2/JARVIS-OS-V.2/` (gitignored)
- Cherry-pick policy: `jarvis-os-v2/CHERRY_PICK.md`
- Do **not** replace `/api/ask` or OpenJarvis with this repo without explicit approval

## Setup on E's Mac

1. `npm run jarvis-os-v2:bootstrap`
2. `cd jarvis-os-v2/JARVIS-OS-V.2 && python scripts/setup_jarvis.py`
3. `GEMINI_API_KEY` in clone `.env`
4. `jarvis` or `npm run jarvis-os-v2:self-test` after venv exists

## Boundaries

- No Family Purpose / student PII through upstream desktop messaging tools unless E opts in locally
- Iris PWA and Netlify guardrails in `AGENTS.md` still govern production
