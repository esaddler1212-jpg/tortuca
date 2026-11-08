# Flight Nemulator — character customization

## Full loadout tier (most options)

| Hero | Codename | Mutates from | What you can change |
|------|----------|--------------|---------------------|
| `tin-aviator` | Tin Aviator | Iron Man | **16 armor presets** — Mk I through LXXXV, Hulkbuster, stealth, bleeding edge, Rescue gold; each has **RGB suit color** on the mesh + **SPD/PWR** modifiers |
| `red-codriver` | Red Codriver | War Machine | **12 armor kits** — Patriot, gunship, siege, stealth, desert camo, plasma, etc. |
| `shade-knight` | Shade Knight | Batman | **14 capes / eras** — night, Year One, animated, Arkham, Beyond, Hellbat-inspired, camo; **jetpack modes** (tactical, Beyond jet, Hellbat, glider rig) swap flight assist + aerial label |

HUD: **Suits & colors** panel with grouped dropdown, live color swatch, and `SPD % · PWR %` readout. Selection persists in `localStorage` (`flight-nemulator-form-<heroId>`).

## Standard tier (everyone else)

| Kind | Examples | Customization |
|------|----------|----------------|
| **Dual forms** | Ki Wanderer ascended, Phoenix Ember, Solar Apex godmode | 2 forms — speed/power/color |
| **Ring corps** | Hal / John / Guy / Kyle | 2 forms each + distinct default palette |
| **Single loadout** | Nova, Comet Surfer | No picker (one silhouette) |
| **Custom heroes** | Player-crafted | Primary color + power at create time |

## Technical

- Data: `HeroSpec.forms`, `HeroSpec.suitVariants` (`hero-roster.ts`)
- Resolution: `resolveHeroForm()` (`hero-forms.ts`) — paints hero mesh + stats
- UI: `listHeroLoadouts()` (`hero-customization.ts`)
- Flight assist: Batman jet modes → `effectiveHeroAerial()` + `syncFlightAssistVisuals()`

## CI

`tsx scripts/check-hero-loadouts.mts` — Iron Man ≥ 14 loadouts, War Machine ≥ 10, Batman ≥ 12.
