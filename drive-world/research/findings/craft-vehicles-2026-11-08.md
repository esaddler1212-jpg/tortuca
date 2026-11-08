# Craft Anything vehicle pass — City Nights (2026-11-08)

## Method

1. Ran `tools/craft-anything/bin/craft-anything-cli doctor` — MCP + Chromium OK on agent VM.
2. Constraint: **no** ripping commercial game meshes; originals only for this pass.
3. Craft cars now load **Kenney CC0 GLBs** (`craft-bay-wedge` → sedan-sports, `craft-night-lift` → suv, `craft-street-spike` → race) with tuned visuals in `vehicle-gltf.ts`. The procedural block bodies in `craft-vehicle-mesh.ts` remain as the fallback when a GLB fails to load.

## Deliverables

| Vehicle | Token | Visual |
|---------|-------|--------|
| Bay Wedge | `craft-wedge-shard` @ Marin view corridor | Angled shell + cyan lip |
| Night Lift | `craft-lift-shard` @ Oakland meet | Cage + roof rack |
| Street Spike | `craft-spike-shard` @ SAP lot | Low deck + fins |

## Follow-up (Craft CLI)

Use `drive-world/research/city-nights-browser` project + `web_site_capture` on Netlify preview to validate silhouette readability at 390px width before swapping the Kenney stand-ins for exported GLBs from a future Craft rebuild.
