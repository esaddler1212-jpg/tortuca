# City Nights — art brief (Vallejo slice)

Visual north star for **Bay night festival driving**: not photoreal geography, but a consistent **coastal fog + emissive signs** read at TV distance.

## Silhouette & scale

- Low-poly; readable at 1080p on a couch. No detail under ~2 m unless it is gameplay (pumps, garage door, sprint gates).
- Vehicles: Kenney GLB or deliberate Craft block bodies — no anonymous grey boxes on player cars.
- District kits replace **clusters** of colored boxes, not the whole world at once.

## Palette (single source of truth)

Use `drive-world/src/night-palette.ts`:

- Fog / sky: `NIGHT_FOG`, `NIGHT_SKY`, `NIGHT_AMBIENT`
- Accent orange: `BAY_BRIDGE_ORANGE` (estate neon, pump trim)
- Window variety: `BAY_WINDOW_LIGHTS` — pick 2–3 per block, never random RGB
- Water: `BAY_WATER_DEEP`, `BAY_WATER_GLOW`

HUD hex accents must match existing CSS nitro / chapter stripes — do not invent a third palette.

## Night read

- Diffuse albedo stays dark; **emissive** carries fantasy (storefront strips, pump canopies, estate underglow).
- Street decks sit at `streetDeckY` (~0.14 m in flat districts); physics ground top must meet wheel raycasts within ~5 cm of that deck.
- Regional fog from `regional-weather.ts` — art passes tune intensity, not new sky systems.

## Density

- **Vallejo estate (slice 1):** garage silhouette, driveway collision, 2 pump islands, 3–6 palms/trim props; optional Kenney GLBs when `public/models/kenney-city/` is installed.
- **SF Embarcadero / Ferry (slice 2):** clock tower + wings, plaza + pier decks (collision), market awnings, string lights; Kenney ring at `SF_FERRY_POINT` (−780, −520).
- **Marin Golden Gate vista (slice 3):** south approach pull-off deck (collision), orange cable hints + beacons, vista sign; Kenney at `MARIN_GG_VISTA` (−1165, −455).
- **East Bay Lake Merritt (slice 4):** lakeside promenade deck (collision), water ring glow, benches + string lights; Kenney at `EAST_BAY_LAKE` (620, −120).
- **Peninsula SFO gate (slice 5):** airport lot deck (collision), tower + taxi strip, Tokyo gate sign; Kenney at `PENINSULA_SFO_GATE` (−420, −1260).
- **South Bay SAP (slice 6):** arena plaza deck (collision), ring façade, marquee, light towers; Kenney at `SOUTH_BAY_SAP` (400, −1220).
- All six Bay region anchors are listed in `shared/art-district-manifest.json`. Optional GLB packs: [`FREE_3D_BUILDING_ASSETS.md`](./FREE_3D_BUILDING_ASSETS.md).

## Local visual stack

Follow [`VISUAL_UPGRADE_TIERS.md`](./VISUAL_UPGRADE_TIERS.md) — Tier 0 settings, Tier 1 `install-free-packs.sh --city-glb`, Tier 3+ engine hooks.

## Credits

Any GLB under `drive-world/public/models/` needs a line in `drive-world/public/models/CREDITS.md` (CC0 / license link).

## Polish references

- Vice ’86 carousel: neon **density** and lane-line ideas only — [`GAME_POLISH_VICE86_PROMPTS.md`](./GAME_POLISH_VICE86_PROMPTS.md)
- Feel goals: [`CITY_NIGHTS_FEEL.md`](./CITY_NIGHTS_FEEL.md)