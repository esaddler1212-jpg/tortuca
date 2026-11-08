# Vehicle models

Kenney **Car Kit** `.glb` files live in `kenney/`. They preload at boot via `vehicle-gltf.ts` and attach in `vehicle-factory.ts` (compound box collision + raycast wheels unchanged).

If preload fails, the game falls back to procedural block meshes.

See `CREDITS.md` for licensing.
