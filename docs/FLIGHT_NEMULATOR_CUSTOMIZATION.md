# Flight Nemulator — character customization

## Ability kit tier (deepest combat options)

| Hero | Codename | Kits | What you swap |
|------|----------|------|----------------|
| `tin-aviator` | Tin Aviator | **7** | Repulsors, unibeam, micro-missiles, rockets, EMP, siege frame, pulse lasers — each with distinct **range, cooldown, damage, super radius** |
| `red-codriver` | Red Codriver | **7** | Salvo cannons, gatling, bunker buster, plasma, shock fists, SAM, orbital bracer |
| `shade-knight` | Shade Knight | **9** | Glider, batarangs, grapple, smoke, explosive gel, jet / Beyond / inferno rigs |

HUD: **Ability kit** dropdown with per-kit ability list and SPD/PWR %. Selection persists in `localStorage` (`flight-nemulator-form-<heroId>`). Flight assist for Batman jet kits updates live via `effectiveHeroAerial()`.

Cosmetic armor/cape libraries were removed from this tier on purpose — depth is in **abilities**, not paint chips.

## Standard tier (everyone else)

| Kind | Examples | Customization |
|------|----------|----------------|
| **Dual forms** | Ki Wanderer ascended, Phoenix Ember, Solar Apex godmode | 2 forms — speed/power/color |
| **Ring corps** | Hal / John / Guy / Kyle | 2 forms each + distinct default palette |
| **Single loadout** | Nova, Comet Surfer | No picker (one silhouette) |
| **Custom heroes** | Player-crafted | Primary color + power at create time |

## Technical

- Data: `HeroForm.abilities`, `kitPrimary`, combat multipliers (`hero-roster.ts`)
- Combat: `primaryStrikeParams(hero, powerMul, form)` (`combat.ts`)
- UI: `listHeroLoadouts()` (`hero-customization.ts`)

## CI

`tsx scripts/check-hero-loadouts.mts` — Iron Man, War Machine, and Batman each have many ability kits with at least two named abilities per kit and **no** `suitVariants`.
