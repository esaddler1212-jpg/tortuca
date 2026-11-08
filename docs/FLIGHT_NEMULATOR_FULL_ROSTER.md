# Flight Nemulator — full roster & mutations

Homage codenames only — not affiliated with Marvel, DC, Toei/Shueisha, etc.

**Removed from playable roster (per product):** Hawkeye, Ant-Man, Captain Marvel — not in game. **Dr. Doom** and **Ultron (Chrome Overmind)** are **villain clones only**, not playable.

Regenerate: `tsx scripts/audit-aerial-roster.mts` · Source: `roster-mutations.ts`

## Playable heroes (23)

| Codename | Mutates from | U | Aerial |
|----------|--------------|---|--------|
| Solar Apex | Superman | DC | Innate |
| Solar Envoy | Supergirl | DC | Innate |
| Emerald Pilot | Green Lantern | DC | Ring |
| Velocity Streak | The Flash | DC | Innate (speed force) |
| Shade Knight | Batman | DC | Glide / tactical jetpack |
| Martian Strider | Martian Manhunter | DC | Innate |
| Amazon Vanguard | Wonder Woman | DC | Innate |
| Ember Strider | Starfire | DC | Innate |
| Thunder Zealot | Shazam | DC | Innate |
| Tin Aviator | Iron Man | Marvel | Tech |
| Red Codriver | War Machine | Marvel | Tech |
| Chrome Sage | Vision | Marvel | Innate |
| Storm Hammer | Thor | Marvel | Innate |
| Wall Crawler | Spider-Man | Marvel | Web-zip |
| Comet Surfer | Silver Surfer | Marvel | Innate |
| Nova Centurion | Nova | Marvel | Innate |
| Flame Jet | Human Torch | Marvel | Innate |
| Wing Captain | Falcon | Marvel | Tech wings |
| Ki Wanderer | Goku | DBZ | Ki |
| Ki Prince | Vegeta | DBZ | Ki |
| Ki Sage | Piccolo | DBZ | Ki |
| Time Blade | Future Trunks | DBZ | Ki |
| Hybrid Warden | Gohan | DBZ | Ki |

## Villain clones (25)

| Codename | Mutates from | U | Notes |
|----------|--------------|---|--------|
| Emperor Frieze | Frieza | DBZ | Ki siege |
| Dark Saiyan Jackal | Saiyan rogue archetype | DBZ | Ki |
| Cell Mimic | Cell | DBZ | Hunts Goku-line heroes |
| Spirit Buu | Majin Buu | DBZ | Ki |
| Legend Bruiser | Broly | DBZ | Ki — wrath siege |
| Cataclysm Deity | Beerus | DBZ | Ki — hakai-style |
| Android Phalanx | Android 17/18 archetype | DBZ | Ki — infinite energy |
| **Dr. Doom** | Doctor Doom | Marvel | **Villain only** |
| **Chrome Overmind** | Ultron | Marvel | **Villain only** |
| Magnet Warden | Magneto | Marvel | Magnet flight |
| Titan Snap Echo | Thanos | Marvel | Innate |
| Brute Abom | Abomination | Marvel | Jetpack assist |
| Venom Echo | Venom | Marvel | Glide |
| Goblin Glider | Green Goblin | Marvel | Glider |
| Trickster Prince | Loki | Marvel | Innate |
| Steel Wraith | T-1000-style assassin | Marvel | Innate |
| Laughing Harlequin | Joker & Harley | DC | Jetpack |
| Krypton Eclipse | General Zod | DC | Innate |
| Deathstroke Arc | Deathstroke | DC | Jetpack |
| Night Gargoyle | Man-Bat | DC | Glide |
| Doomsday Echo | Doomsday | DC | Jetpack |
| Black Adam Echo | Black Adam | DC | Innate |
| Omega Tyrant | Darkseid | DC | Innate |
| Brain Colossus | Brainiac | DC | Tech |
| Sine Warden | Sinestro | DC | Ring |

Rival pairings live in `villain-roster.ts` (`rivalHeroIds`).

## DBZ research notes (why these picks)

| Archetype | Why they fit flight sandbox |
|-----------|----------------------------|
| Piccolo | Ki hover, regen, mentor rival to Goku line |
| Future Trunks | Ki + sword energy, time-travel hero |
| Gohan | Ki flight, hidden power spikes |
| Broly | Ki brute — natural siege villain |
| Beerus | God ki + destruction orbit attacks |
| Androids | Infinite stamina fantasy, speed strafe |

Future DBZ candidates (not yet added): Whis (angel ki), Jiren (tournament brute), Gogeta fusion (event skin).
