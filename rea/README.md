# REA (local reverse-engineering tools) — Tortuca companion

This folder does **not** ship [REA](https://github.com/morluto/rea) (“Reverse Engineer Anything”) inside the IRIS repo. REA is a **large TypeScript MCP + native tooling** stack that runs on **your machine** (Mac/iMac) and registers with **Cursor** (or other agents). IRIS only documents the workflow and gives you a **shallow clone helper** — the clone lives in `rea/rea/` and is **gitignored**.

## What it is

- **Upstream:** [morluto/rea](https://github.com/morluto/rea) · **Site:** [rea.tools](https://rea.tools/)
- MCP tools for inspecting **binaries, Electron/JS bundles, .NET**, and more; analysis runs **locally**.
- Typical setup: `npx rea-agents setup` (review and approve the config changes it proposes).

## Quick start

1. **Bootstrap** (optional — shallow clone for docs / source browsing):

   ```bash
   cd rea
   chmod +x bootstrap.sh   # once, if needed
   ./bootstrap.sh
   ```

   **Update** an existing clone: `REA_PULL=1 ./bootstrap.sh`

2. **Register with Cursor** (run on your Mac, from a **trusted directory outside** this project if you prefer — see upstream `docs/installation.md`):

   ```bash
   npx rea-agents setup
   ```

   Pick **Cursor** in the agent list, review the proposed MCP/workflow changes, restart Cursor.

3. **Use it** from Cursor chats on this repo (or any project), e.g. “Use REA to explain how X works in app Y and show evidence.”

## IRIS relation

- **IRIS (this PWA)** does not call REA from Netlify functions. REA is **developer-side** (local MCP + optional native engines like Hopper/Ghidra).
- The **Woodhouse → Iris team** card links here for discoverability; optional tools (Voicebox, n8n, God’s Eye) use the same pattern.

## Safety

- Get REA only from **[morluto/rea](https://github.com/morluto/rea)**, [rea.tools](https://rea.tools/), or **`rea-agents` on npm** — verify official sources; copied READMEs are not proof of authenticity (see upstream README “IMPORTANT” callout).
- Do not point REA at **Family Purpose**, student PII, or unrelated private data unless you intend to analyze them locally under your own policy.

`rea/rea/` is **gitignored** so the clone never lands in Tortuca commits.
