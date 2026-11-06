---
name: rea
description: >
  Add or use REA (Reverse Engineer Anything) from morluto/rea with IRIS/Tortuca.
  Use when E asks to set up REA, install the reverse-engineering MCP, clone rea,
  or connect Cursor to binary/app inspection tools alongside IRIS.
---

# REA + IRIS

REA is **not** part of the Netlify PWA. It is a **local MCP** (plus optional native analysis engines) that you run on a Mac, registered with **Cursor** or other agents.

## Where things live in Tortuca

- Companion docs and bootstrap: `rea/README.md`, `rea/bootstrap.sh`
- `npm run rea:bootstrap` — shallow-clones upstream into `rea/rea/` (gitignored)
- Woodhouse panel links to the upstream repo from the UI (`NetworkPanel` in `src/components/hud/HudPanels.tsx`)

## Official install (your machine)

1. Prefer releases from [morluto/rea](https://github.com/morluto/rea), [rea.tools](https://rea.tools/), or npm `rea-agents` only.
2. Run `npx rea-agents setup`, select **Cursor**, review proposed config changes, restart Cursor.
3. Upstream details: `docs/installation.md` in the clone; for a shallow clone first: `./rea/bootstrap.sh` from repo root.

## Boundaries

- Do not route Family Purpose / student PII through REA unless E explicitly wants local analysis of that material.
- REA does not replace IRIS server tools (`/api/ask`, etc.) — it augments **developer** sessions in Cursor.
