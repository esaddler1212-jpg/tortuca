# Bay Area mock landmarks (`drive-world`)

Low-poly **stand-ins** for well-known places. Not to scale; positions follow the compressed `+X east / +Z north` layout in [`world-config.ts`](../drive-world/src/world-config.ts). Implemented in [`build-landmarks.ts`](../drive-world/src/build-landmarks.ts).

| Region | Mock landmark | Entity prefix (approx.) |
|--------|---------------|-------------------------|
| **San Francisco** | Transamerica Pyramid | `transamerica-*` |
| | Salesforce Tower | `salesforce-tower` |
| | Coit Tower | `coit-tower` |
| | Ferry Building | `ferry-*` |
| | Palace of Fine Arts | `palace-*` |
| | Golden Gate Bridge | `golden-gate-*` |
| **Marin / North Bay** | Sausalito hillside block | `sausalito-hill` |
| | Napa silo | `napa-silo` |
| | Carquinez strait tower | `carquinez-tower` |
| **East Bay** | Sather Campanile (Berkeley) | `sather-campanile-*` |
| | Grizzly Peak overlook | `grizzly-*` |
| | Fox Theater (Oakland) | `fox-*` |
| | Oakland Arena ring | `oakland-arena-*` |
| | Lake Merritt | `lake-merritt` |
| **Vallejo** | Mare Island crane | `mare-island-crane-*` |
| **Peninsula** | Hoover Tower | `hoover-tower` |
| | Dumbarton Bridge | `dumbarton-*` |
| **South Bay** | San José City Hall | `sj-city-hall-*` |
| | Winchester Mystery House steps | `winchester-*` |
| | Apple Park ring | `apple-park-*` |
| | SAP Center | `sap-*` |

## Adding another landmark

1. Pick `(x, z)` inside the right `DISTRICTS.*` bounds; use `hillOffsetM(x, z)` for ground **y** when not on a bridge.
2. Add primitives in `buildBayAreaLandmarks()` using `box()`, `pyramid()`, `ringBuilding()`, or `bridgeSpan()`.
3. Set `collider: true` on one footprint box if you need static collision (most are visual-only).
4. Keep clearance from `FREEWAY_ROUTES` — procedural blocks already skip the freeway corridor.

## Art

Shared materials: [`landmark-materials.ts`](../drive-world/src/landmark-materials.ts) (glass, warm windows, stone, International Orange).
