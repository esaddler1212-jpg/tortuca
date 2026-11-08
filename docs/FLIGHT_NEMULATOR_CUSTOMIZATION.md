# Flight Nemulator — character customization

**Battleworld** is the fan name for the shared planet: Marvel / DC / DBZ homages coexist, fight paired rivals, and fight over districts (see Story mechanics). Per-hero arc blurbs + lattice progress: [`FLIGHT_NEMULATOR_BATTLEWORLD_ARCS.md`](./FLIGHT_NEMULATOR_BATTLEWORLD_ARCS.md).

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
| **Coast Lantern safe house** | Solar Apex at **Coast City**: **H** / ask Emerald Pilot for **final-boss aid** (ally + weakened pair rival) or **attack keeper** → villain + forced **yellow fear ring** |
| **Latverian Sovereign** | Playable **Doctor Doom** — **only** character with Hero/Villain alignment toggle |
| **Doom endings** | **Hero:** beat wave-10 pair rival → **new timeline** (fresh Earth generation). **Villain:** **Remake in my image** on dying Earth or **Annihilate** → **God Emperor** loadout + locked villain alignment |
| **Territory invasion** | **Villain:** raid another hero’s **district** (destruction heat) → defenders spawn → beat them → **H** henchmen / **G** raze. **Villain advisors** (other rogues) give **pair-hero** tips on **H**. **Hero:** stop **henchmen takeovers** before wave-10 **pair boss** unlocks |
| **Infinity Stones** | **Titan Snap Echo**, **Trickster Prince**, and **Chrome Overmind** race six stones on Battleworld. **Hero:** **H** at a stone to seal it. **Villain:** collect **6** for **God Emperor** power (Doom → Battleworld throne loadout). First hunter to **6** becomes a **God Emperor** boss like Doom |
| **Character arcs** | Every roster hero has a **Battleworld arc** (HUD hint). Shared beats: takeovers, stones, wave-10 pair rival, optional **H** at Coast / Ki Plateau / Stark Nexus. Links to rival villains in `battleworld-arcs.ts` |
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
