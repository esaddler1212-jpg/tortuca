# Flight Nemulator — full roster & mutations

Homage codenames only — fan tribute, not affiliated with Marvel, DC, Toei/Shueisha, etc.  
**Mutates from** = informal inspiration for who the homage is riffing on.

Regenerate from CI: `tsx scripts/audit-aerial-roster.mts`.

## Playable heroes (24)

| Codename | Mutates from | U | Aerial | Scripted villain rivals (subset) |
|----------|--------------|---|--------|--------------------------------|
| Solar Apex | Superman | DC | Innate | Cell Mimic, Titan Snap Echo, Krypton Eclipse, … |
| Emerald Pilot | Green Lantern | DC | Ring | Black Adam Echo, Sine Warden |
| Tin Aviator | Iron Man | Marvel | Tech | Dr. Doom, Magnet Warden, Titan Snap Echo, … |
| Chrome Sage | Vision | Marvel | Innate | Magnet Warden, Steel Wraith |
| Chrome Overmind | Ultron | Marvel | Tech | Dr. Doom, Brain Colossus |
| Dr. Doom | Doctor Doom | Marvel | Tech | Dr. Doom (clone), … |
| Storm Hammer | Thor | Marvel | Innate | Dr. Doom, Spirit Buu, Black Adam Echo, Trickster Prince, … |
| Ki Wanderer | Goku | DBZ | Ki | DBZ clones, Cell Mimic |
| Ki Prince | Vegeta | DBZ | Ki | DBZ clones |
| Wall Crawler | Spider-Man | Marvel | Web-zip | Magnet Warden, Venom Echo, Laughing Harlequin, Deathstroke Arc, Goblin Glider |
| Red Codriver | War Machine | Marvel | Tech | Brute Abom |
| Martian Strider | Martian Manhunter | DC | Innate | Night Gargoyle, Omega Tyrant, Trickster Prince |
| Shade Knight | Batman | DC | Glide (+ tactical jetpack) | Venom Echo, Laughing Harlequin, Deathstroke Arc, Night Gargoyle |
| Amazon Vanguard | Wonder Woman | DC | Innate | Titan Snap Echo, Doomsday Echo, Omega Tyrant |
| Bolt Archer | Hawkeye | Marvel | Jetpack | Deathstroke Arc |
| Ant Scale | Ant-Man | Marvel | Jetpack | Brute Abom |
| Comet Surfer | Silver Surfer | Marvel | Innate | Omega Tyrant, Titan Snap Echo |
| Photon Vanguard | Captain Marvel | Marvel | Innate | Titan Snap Echo, Sine Warden |
| Nova Centurion | Nova | Marvel | Innate | Steel Wraith |
| Solar Envoy | Supergirl | DC | Innate | Brain Colossus |
| Ember Strider | Starfire | DC | Innate | — |
| Flame Jet | Human Torch | Marvel | Innate | Goblin Glider |
| Wing Captain | Falcon | Marvel | Tech | — |
| Thunder Zealot | Shazam | DC | Innate | Trickster Prince, Black Adam Echo |

Custom heroes from local storage use codename **Player original** (no rights-holder riff).

## Villain clones (21)

| Codename | Mutates from | U | Aerial | Hunts (hero ids) |
|----------|--------------|---|--------|------------------|
| Emperor Frieze | Frieza | DBZ | Ki | Ki Wanderer, Ki Prince |
| Dark Saiyan Jackal | Saiyan antagonist archetype | DBZ | Ki | Ki Prince, Ki Wanderer |
| Cell Mimic | Cell | DBZ | Ki | Ki Wanderer, Solar Apex |
| Spirit Buu | Majin Buu | DBZ | Ki | Ki Wanderer, Storm Hammer |
| Dr. Doom | Doctor Doom | Marvel | Tech | Dr. Doom, Tin Aviator, Chrome Overmind, Storm Hammer |
| Magnet Warden | Magneto | Marvel | Magnet | Chrome Sage, Wall Crawler, Tin Aviator |
| Titan Snap Echo | Thanos | Marvel | Innate | Tin Aviator, Solar Apex, Amazon Vanguard, Photon Vanguard, Comet Surfer |
| Brute Abom | Abomination | Marvel | Jetpack | Red Codriver, Solar Apex, Ant Scale |
| Venom Echo | Venom | Marvel | Glide | Wall Crawler, Shade Knight |
| Laughing Harlequin | Joker & Harley Quinn | DC | Jetpack | Shade Knight, Wall Crawler |
| Krypton Eclipse | General Zod | DC | Innate | Solar Apex |
| Deathstroke Arc | Deathstroke | DC | Jetpack | Shade Knight, Bolt Archer, Wall Crawler |
| Night Gargoyle | Man-Bat | DC | Glide | Shade Knight, Martian Strider |
| Doomsday Echo | Doomsday | DC | Jetpack | Solar Apex, Amazon Vanguard, Storm Hammer |
| Black Adam Echo | Black Adam | DC | Innate | Storm Hammer, Emerald Pilot, Solar Apex, Thunder Zealot |
| Goblin Glider | Green Goblin | Marvel | Glide | Wall Crawler, Tin Aviator, Flame Jet |
| Omega Tyrant | Darkseid | DC | Innate | Solar Apex, Amazon Vanguard, Martian Strider, Comet Surfer |
| Brain Colossus | Brainiac | DC | Tech | Chrome Overmind, Chrome Sage, Solar Apex, Solar Envoy |
| Trickster Prince | Loki | Marvel | Innate | Storm Hammer, Martian Strider, Thunder Zealot |
| Sine Warden | Sinestro | DC | Ring | Emerald Pilot, Photon Vanguard |
| Steel Wraith | Liquid-metal assassin (T-1000 archetype) | Marvel | Innate | Chrome Sage, Tin Aviator, Nova Centurion |

## Files

| File | Role |
|------|------|
| `flight-nemulator/src/hero-roster.ts` | Playable stats, powers, aerial |
| `flight-nemulator/src/villain-roster.ts` | Siege clones + rival pairings |
| `flight-nemulator/src/roster-mutations.ts` | **Mutates from** map (single source of truth) |
