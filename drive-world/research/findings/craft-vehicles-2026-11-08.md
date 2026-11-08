# Craft Anything vehicle pass — City Nights (2026-11-08)

## Method

1. Ran `tools/craft-anything/bin/craft-anything-cli doctor` — MCP + Chromium OK on agent VM.
2. Constraint: **no** ripping commercial game meshes; originals only for this pass.
3. Shipped **procedural block bodies** in `craft-vehicle-mesh.ts` (PlayCanvas boxes) — same spirit as Craft rebuild loops but hand-authored for Tortuca.

## Deliverables

| Vehicle | Token | Visual |
|---------|-------|--------|
| Bay Wedge | `craft-wedge-shard` @ Marin view corridor | Angled shell + cyan lip |
| Night Lift | `craft-lift-shard` @ Oakland meet | Cage + roof rack |
| Street Spike | `craft-spike-shard` @ SAP lot | Low deck + fins |

## Follow-up (Craft CLI)

Use `drive-world/research/city-nights-browser` project + `web_site_capture` on Netlify preview to validate silhouette readability at 390px width before replacing block bodies with exported GLB from a future Craft rebuild.
