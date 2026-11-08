# Flight Nemulator — character customization

## Suit + ability tier (Iron Man, War Machine, Batman)

Each **suit** is one loadout row: paint/color on the mesh, a **role** tag, and a unique **ability pair** with combat tuning.

| Role | Tradeoff |
|------|----------|
| **Swift flight** | Higher speed/agility, lighter firepower |
| **Siege power** | Heavy damage/supers, slower silhouette |
| **Bulwark resilience** | Better stamina regen / boost efficiency, tankier |
| **Balanced** | Default all-rounder |

| Hero | Suits | Pair rival (wave 10 boss) |
|------|-------|---------------------------|
| `tin-aviator` | 9 | **Dr. Doom** |
| `red-codriver` | 8 | **Brute Abom** |
| `shade-knight` | 10 | **Laughing Harlequin** |

Other heroes use their first scripted rival for the pair boss if no pin is set.

HUD: **Suits & abilities** — grouped by role, color swatch, ability list, SPD/PWR (and RES% on bulwark suits).

## Final pair duel

- Hero role, **wave 10**: regular waves pause, pair rival spawns as an oversized boss that **chases you** (not building siege).
- Warning ~3 waves earlier; HUD shows incoming/active/defeated + boss HP%.
- Boss pressure drains stamina when close — **bulwark** suits help.
- Defeating the pair rival resumes normal waves.

## Story mechanics

| Feature | How |
|---------|-----|
| **Solar Apex rings** | Loadouts **Emerald ring** (green will) and **Yellow ring** (fear echo) — ring primary + constructs |
| **Latverian Sovereign** | Playable **Doctor Doom** — **only** character with Hero/Villain alignment toggle |
| **Wall Crawler symbiote** | Defeat **Venom Echo** or **Carnage Echo** → unlock **Symbiote — merged suit** loadout |
| **Venom bonds** | Play **Venom Echo** (villain) — each **hero** you drop adds a **Bonded — &lt;hero&gt;** loadout (color + power mimic, up to 8) |
| **Cell / Buu absorb** | Playable **Cell Mimic** & **Spirit Buu** (villain-only) stack up to 6 absorbed foes; copiers borrow primary power + dmg/speed |

## Standard tier

Dual-form heroes, Lantern corps, custom heroes — unchanged (two forms or create-time color).

## Technical

- `HeroForm`: `suitRole`, `abilities`, `kitPrimary`, combat multipliers, `resilienceMul` / `flightAgilityMul`
- `hero-pair-boss.ts`: spawn + pinned pairs
- `faction-npcs.ts`: `isPairBoss` chase AI

## CI

- `check-hero-loadouts.mts` — suit counts, abilities, roles
- `check-pair-boss.mts` — pair mappings
