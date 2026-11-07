---
name: hallmark
description: >
  Install or use Hallmark (Nutlope/hallmark) for anti–AI-slop UI design in Cursor
  sessions on Tortuca. Use when E asks for Hallmark, usehallmark.com, /hallmark
  redesign or audit, or polish IRIS-facing UI with the design skill.
---

# Hallmark + IRIS

Hallmark is a **Cursor agent skill** (not part of the Netlify PWA). It improves **visual craft** and lint gates; it does not reverse-engineer binaries (see `rea/` or REA docs when that is the goal).

## Where things live in Tortuca

- Companion docs: `hallmark/README.md`, optional clone via `hallmark/bootstrap.sh`
- `npm run hallmark:bootstrap` — shallow clone into `hallmark/hallmark/` (gitignored)
- Woodhouse panel links upstream from `src/components/hud/HudPanels.tsx`

## Install (E’s machine)

```bash
npx skills add nutlope/hallmark -g --agent cursor
```

Node 18+. For full browser sloplint: upstream notes on `puppeteer-core` + Chrome.

Invoke: `/hallmark <prompt>` or “use Hallmark to …”.

## Boundaries

- Does not change Iris server guardrails or `/api/ask`.
- Respect Family Purpose / student privacy in any redesign prompts.
