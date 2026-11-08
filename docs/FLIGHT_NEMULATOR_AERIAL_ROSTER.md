# Flight Nemulator — aerial roster audit

Homage codenames only. Every character can operate in the 6DOF flight sandbox via **innate flight**, **suit/ring/ki**, or an explicit assist (**jetpack**, **glider**, **web-zip**). Grounded homages get a visible jetpack (or glide mesh) on the player and NPC clones.

Run: `tsx scripts/audit-aerial-roster.mts` (also wired into `npm run test:flight-nemulator`).

## Current playable heroes

| Codename | Aerial | Inspiration (informal) |
|----------|--------|-------------------------|
| Solar Apex | Innate flight | Flying alien hero |
| Emerald Pilot | Construct flight | Ring wielder |
| Tin Aviator | Suit thrusters | Armored flier |
| Chrome Sage | Innate flight | Density/intangible flyer |
| Chrome Overmind | Suit thrusters | Robot body |
| Dr. Doom | Suit thrusters | Armored sorcerer hover |
| Storm Hammer | Innate flight | Thunder god / hammer arc |
| Wall Crawler | Web-zip lines | Web-swing aerial |
| Red Codriver | Suit thrusters | Heavy armor |
| Martian Strider | Innate flight | Alien shapeshifter |
| Shade Knight | Glider cape (Tactical = jetpack) | Cape glide + optional jet rig |
| Amazon Vanguard | Innate flight | Blessing / godflight |
| Bolt Archer | Jetpack rig | Marksman (no canon flight) |
| Ant Scale | Jetpack rig | Size-changer belt jets |
| Ki Wanderer | Ki hover | DBZ |
| Ki Prince | Ki hover | DBZ |

## Current villain clones

| Codename | Aerial | Universe |
|----------|--------|----------|
| Dr. Doom | Suit thrusters | Marvel |
| Magnet Warden | Magnetic levitation | Marvel |
| Titan Snap Echo | Innate flight | Marvel |
| Brute Abom | Jetpack rig | Marvel |
| Venom Echo | Glider wings | Marvel |
| Laughing Harlequin | Jetpack rig | DC |
| Krypton Eclipse | Innate flight | DC |
| Deathstroke Arc | Jetpack rig | DC |
| Night Gargoyle | Wing-glide | DC |
| Doomsday Echo | Jetpack rig | DC |
| Black Adam Echo | Innate flight | DC |
| (DBZ four) | Ki hover | DBZ |

## Potential roster adds (flying-first)

Suggested **homage codenames** — natural fits for a flight sandbox (Marvel/DC weighted).

| Suggested codename | Flight basis | Role |
|--------------------|--------------|------|
| Comet Surfer | Innate (board) | Hero — cosmic herald |
| Photon Vanguard | Innate / binary | Hero — energy flier |
| Nova Centurion | Innate | Hero — corps flier |
| Solar Envoy | Innate | Hero — Kryptonian cousin |
| Ember Strider | Innate | Hero — alien energy fly |
| Flame Jet | Innate / plasma trail | Hero — torch flier |
| Wing Captain | Tech wings | Hero — falcon rig |
| Thunder Zealot | Innate (magic) | Hero — mythic flier |
| Goblin Glider | Glide rig | Villain — board/glider |
| Omega Tyrant | Innate hover | Villain — cosmic brute |
| Brain Colossus | Tech drone body | Villain — android |
| Trickster Prince | Innate (magic) | Villain — illusion flight |
| Sine Warden | Ring flight | Villain — corps rival |
| Steel Wraith | Innate | Villain — liquid metal flier |

## Design rule (enforced in data)

- `HeroSpec.aerial` and `VillainCloneSpec.aerial` are required.
- Jetpack and glide meshes attach via `syncFlightAssistVisuals` in `aerial-mobility.ts`.
