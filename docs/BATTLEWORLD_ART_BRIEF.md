# Battleworld — art & HUD brief (slice 1)

Greybox flight combat with **hero GLB when present** (`public/models/heroes/<id>.glb`); procedural blocks remain the fallback.

## Slice 2 (this pass)

- **Hero panel:** pair/story/lattice chips stay visible; long arc copy lives under `<details class="hero-picker-more">`.
- **Scoped hints:** `.hero-picker .hud-hint` no longer uses viewport-absolute bottom placement.
- **District Kenney ring:** `placeDistrictKenneySkyline` — four CC0 buildings per district center when `kenney-city/` is installed.

## Slice 1

- **Arc objective chip:** centered below top telemetry, two-line clamp (`hud-arc-objective`), shorter arc hint text in `arcObjectiveChip`.
- **Super crater ring:** keeps spawn scale — puff trail animation does not squash the ring (`vfx.ts` `kind: 'ring'`).
- **Default hero:** `solar-apex.glb` (CC0 Blockbench export — see `BLOCKBENCH_WORKFLOW.md`).

## Look

- District read: low-poly blocks + optional Kenney / World Gacha skyline (see `GAMEDEV_RESOURCES.md`).
- HUD density: objective chips live in **positioned** slots — do not stack unscoped `.hud-tag` at the viewport origin.

## Couch QA

`npm run build && npm run test:battleworld` in `flight-nemulator/`. Check arc chip readable at 1280×720 and 1920×1080 without covering the hero panel.