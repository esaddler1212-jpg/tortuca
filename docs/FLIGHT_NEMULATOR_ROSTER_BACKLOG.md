# Battleworld roster research — Marvel, DC, DBZ, off-brand, Transformers

Fan tribute only: **homage codenames**, no trademarks in UI or commits. Lore research stays in docs; playable ids live in `hero-roster.ts` / `villain-roster.ts`.

**Fit criteria (Flight Nemulator v1):**

| Must | Nice |
|------|------|
| Credible **aerial** loop (innate, ring, ki, jetpack, glide, TK hover) | District home + lattice beat |
| Pairs with an existing or planned **rival villain** | Customization / form toggles |
| Distinct power **fantasy** from roster (audit overlaps) | Blockbench GLB pilot |

Current snapshot: ~**40** heroes, **34** villains across **9** districts (`battleworld-districts.ts`). X-Men tier A partially shipped — see [`FLIGHT_NEMULATOR_XMEN_RESEARCH.md`](./FLIGHT_NEMULATOR_XMEN_RESEARCH.md).

---

## Marvel — who’s missing (research)

You already cover the flight-heavy core: Lantern analogs (via Solar + Corps), Iron/War/Vision, Surfer/Nova, Thor, Torch, Falcon, Storm/Phoenix/Angel, Hulk-tier, Doom/Magnet/Thanos/Ultron/Fantastic-adjacent threats.

### Tier A — strong flight + Battleworld gaps

| Suggested codename | Mutates from (inspiration) | Aerial | Role | Why add |
|--------------------|---------------------------|--------|------|---------|
| **Cosmic Envoy** | Captain Marvel / Carol Danvers | Innate + binary glow | Hero | Cosmic-tier damage; stone-hunt rival to Thanos arc |
| **Starbound Outlaw** | Star-Lord | Jet boots / sustained hop | Hero | Aerial gunslinger; lighter than Nova |
| **Monarch Sting** | Wasp / Ant-Man (Wasp) | Winged micro-flight | Hero | Size-shift + hover (distinct from Falcon) |
| **Ikaris Prime** | Ikaris (Eternals) | Innate | Hero | Laser eyes + blue celestial speed |
| **Adam Halo** | Adam Warlock | Innate / soul-gem aura | Hero | Cosmic villain foil; pairs with Magus analogue later |
| **Subsurface Sovereign** | Namor | Flight + swim | Hero | Amphibious district raids; hothead rival to surface heroes |
| **Magnetic Ace** | Quicksilver | Speed + aerial stutter | Hero | X-speed lane (see XMEN doc) |
| **Sunspot Flare** | Sunspot | Solar-charge flight | Hero | Mutant solar flier when “charged” |
| **Rogue Paragon** | Rogue | Borrowed-flight glide | Hero | Power-copy **fantasy** in super throws |

### Tier A — villains (flight-capable)

| Codename | Mutates from | Aerial | Why |
|----------|--------------|--------|-----|
| **Iron Monger Echo** | Iron Monger | Jet assist | Tin Aviator / Red Codriver pin pressure |
| **Vulture Scavenger** | Vulture | Wing harness | Shade Knight / street-tech nemesis |
| **Red Monarch** | Red Hulk / RS | Leap + heat hover | Gamma Titan rival |
| **Sauron Gaze** | Sauron | Pteranodon form | Storm Caller weather nemesis |
| **Annihilus Gate** | Annihilus | Wing + cosmic rod | Comet Surfer / Nova space lane |
| **Magus Mirror** | Magus | Cosmic hover | Adam Halo finale |
| **Iron Sentinel** | Master Mold | Platform jets | Nimrod pairing (XMEN doc) |

### Tier B — stretch (script aerial or short flight)

Doctor Strange (you have Sorcerer Apex — extend beats, not duplicate), Scarlet Witch (TK float), Ghost (thrust suit), Warlock’s siblings, Angela, Blue Marvel, Ms. Marvel (embiggen + glide), She-Hulk (leap arcs).

### Tier C — skip (grounded policy)

Hawkeye, Punisher, Daredevil, most street Defenders without gear flight, Cyclops, Beast, Wolverine (unless super-leap villain echo only).

### Deliberate omissions (product)

Per [`FLIGHT_NEMULATOR_FULL_ROSTER.md`](./FLIGHT_NEMULATOR_FULL_ROSTER.md): **Captain Marvel, Hawkeye, Ant-Man, Starfire** were removed from default playables — **Cosmic Envoy** is the way back for a binary cosmic hero without using a trademark codename.

---

## DC — who’s missing

Heavy hitters in roster: Superman family, four Lanterns, Flash, Batman/Shazam/Hawkman, J’onn, Diana, Strange analogue is Marvel — DC sorcery gap is **Zatanna / Fate** if you want a second mystic.

### Tier A

| Codename | Mutates from | Aerial | Role | Why |
|----------|--------------|--------|------|-----|
| **Nth Wing** | Hawkgirl | Nth-metal wings | Hero | Pairs with Sky Tyrant; mace aerial brawler |
| **Power Echo** | Power Girl | Kryptonian flight | Hero | Alternate “angrier” solar— differentiate speed/power from Solar Envoy |
| **Scarab Pilot** | Blue Beetle (Jaime) | Scarab wings / space | Hero | Tech district + youthful mobility |
| **Booster Chancellor** | Booster Gold | Boots + ring | Hero | Time-travel humor; wanted-heat thief |
| **Captain Atom Core** | Captain Atom | Energy flight | Hero | Military cosmic nukes |
| **Red Cyclone** | Red Tornado | Android wind body | Hero | Weather overlap with Storm — use **wind shear** not lightning |
| **New God Vanguard** | Orion | Astro harness | Hero | Darkseid ladder; war god flight |
| **Raven Shade** | Raven | Soul-self flight | Hero | Occult glide; Gotham nights |

### Tier A villains

| Codename | Mutates from | Notes |
|----------|--------------|--------|
| **Lex Frame** | Lex Luthor (warsuit) | Jet armor; Solar Apex corporate nemesis |
| **Parasite Leech** | Parasite | Leap + power drain mechanics |
| **Livewire Surge** | Livewire | Hovering electricity |
| **Ocean Usurper** | Ocean Master | Trident + limited flight in some runs |
| **Bleez Rage** | Bleez (Red Lantern) | Rage jet |

### Tier B

Firehawk, Superboy (Kon-El), Static (disk hover), John Constantine (skip flight), Black Canary (canon glide marginal).

### Tier C

Nightwing, Robin, Bat-family grounded unless jetpack alt.

---

## Dragon Ball — who’s missing

Roster hits main Z cast + movie power levels (Broly, Beerus, Jiren, Whis). **Bukūjutsu** (flight) is universal for strong ki users — policy: only add if they’re iconic *and* give a new **arc shape** (absorb, emperor, android, god).

### Tier A heroes / anti-heroes

| Codename | Mutates from | Notes |
|----------|--------------|--------|
| **Ki Maiden** | Android 18 | Ki hover; android phalanx rival drama |
| **Fusion Echo** | Gogeta / Vegito (composite) | **Form toggle** on Wanderer/Prince, not solo id yet |
| **Pan Spark** | Pan (GT) | Light ki; younger aerial |
| **Silver Regent** | Cooler / Meta-Cooler | Villain first; “regent” transformation beat |

### Tier A villains

| Codename | Mutates from | Notes |
|----------|--------------|--------|
| **Goku Shade** | Goku Black / Zamasu | Ki flight + timeline Doom synergy |
| **Parasite Infant** | Baby (GT) | Possession / absorb echo |
| **Omega Android** | Super 17 | Energy absorption wave boss |
| **Ember Dragon** | Nuova Shenron (GT) | Sun-hot ki; shadow dragon lane |
| **Ledger Brute** | Ledgic (GT) | Honorable bodyguard; Don Kee homage optional |
| **Turles Jackal** | Expand Dark Saiyan Jackal | Space pirate tree arc |

### Tier B

Hit (no flight — skip), Kale/Caulifla (Berserk bruiser leap), Toppo (Hakai aura hover), Granolah, Gamma duo.

### Tier C

Yamcha, Tien, Krillin, Mr. Satan — comedy NPCs, not flight mains.

---

## Off-brand & adjacent (fits crossover planet)

These reduce trademark surface and freshen Battleworld beyond the big three.

### Image / indie (high flight fit)

| Codename | Mutates from | Universe tag | Notes |
|----------|--------------|----------------|--------|
| **Azure Patriarch** | Omni-Man | `indie` | Viltrumite flight + betrayal arc |
| **Undefeated Youth** | Invincible (Mark) | `indie` | Young viltrumite; father rival |
| **Atom Eve Architect** | Atom Eve | `indie` | Matter construct + hover |
| **Tech Jacket Host** | Tech Jacket | `indie` | Living armor space flight |

**Villains:** Grand Regent analogue **Throne Viltrum**, **Battle Beast**-style brawler (grounded leap + orbit chase).

### “Satire supers” (use carefully)

Homelander / Patriot pastiche: only if you want **moral gray** territory raids — codename **Patriot Apex** (mirrors Solar, not duplicate stats). Keep copy **non-graphic**; no publisher names in UI.

### Public domain & golden age (safe texture)

| Codename | Mutates from | Flight |
|----------|--------------|--------|
| **Condor Warden** | Black Condor | Learned wing flight |
| **Bullet Ascender** | Bulletman / Bulletgirl | Gravity collar |
| **Air Mote** | Airmale | Lighter-than-air |
| **Moth Signal** | Fox Moth | Winged mystery |

Good for a **`golden-mile`** micro-district or “pre-cursors” lattice lore.

### Tokusatsu-adjacent (optional)

Giant robots are **not** human flight roster — see Transformers below. Sentai **ranger glide** is Tier B (jet bikes): **Spectrum Ranger** homage as single hero with team color forms.

---

## Transformers — is it too crazy?

**Short answer: No for Battleworld tone; yes for scope discipline.**

### Narrative fit — **excellent**

Battleworld is already a **patchwork planet** (Marvel + DC + DBZ districts on one ring). A **Cyber Foundry** slab of living metal warriors is the same joke as “everyone shares one sky.” Flight Nemulator’s fantasy is **speed, raid districts, wreck cities** — jet and shuttle modes are native to that loop.

### Legal / product fit — **same rules as Marvel**

Hasbro/Takara own **names, logos, and distinctive silhouettes**. Tortuca policy already avoids trademark strings in client and APIs ([`gamedev-resources/tortuca-public-apis.json`](../gamedev-resources/tortuca-public-apis.json)). You ship:

- Codenames only (e.g. **Crimson Ace**, not Starscream).
- Generic sci-fi jet/ truck **silhouettes**, not G1 exact kibble.
- Fan tribute disclaimer (already in `FLIGHT_NEMULATOR.md`).

Do **not** ship “Autobot,” “Decepticon,” faction logos, or Hasbro character names in manifest/OTA.

### Gameplay fit — **strong, but a new mobility species**

| Pros | Cons |
|------|------|
| Jet form = natural **400+ km/h** cruise | Scale (15–30 ft robots) vs human heroes |
| Vehicle **ram** as super primary | Needs `MutationUniverse: 'cyber'` + rim color |
| Rivals write themselves (jet vs jet) | Transform toggle = engineering slice |
| Orbital / planet shatter looks great | GLB pipeline harder (vehicles + bots) |

**Recommendation:** Add Transformers as **v2 cyber faction** — **3 heroes + 4 villains**, not a full Hasbro roster.

### Suggested cyber cast (homage map)

| Codename | Mutates from | Aerial mode | Role |
|----------|--------------|-------------|------|
| **Chrome Convoy** | Optimus Prime | Truck boost / limited hover | Hero — leader, ground + jet assist |
| **Crimson Ace** | Jetfire / Skystrike archetype | Fighter jet | Hero — righteous jet |
| **Nitro Phantom** | Blitzwing / triple changer idea | Jet + tank modes (2 forms) | Hero |
| **Deceit Winger** | Starscream archetype | F-15 style jet | Villain — rival to Crimson Ace |
| **Megaton Forge** | Megatron archetype | Gunship / tank ram | Villain |
| **Bone Shredder** | Laserbeak / Condor cassette | Small agile jet | Villain advisor |
| **Sound Barrage** | Soundwave archetype | Orbital drone flight | Villain — henchmen waves |
| **Unicron Maw** | Unicron scale | Planet boss event only | **Not** daily playable — world fate |

### World integration

1. Extend `MutationUniverse` with `'cyber' | 'indie' | 'golden'`.
2. Add district **`ion-foundry`** (or split **`cybertron-slab`** wedge on ring).
3. Arc beats: **`alt-mode`** at home, **`seeker-down`** pair boss, territory mech **H**.
4. Aerial policy: `aerial: 'native'` for jets; truck heroes use **boost ram** + short hover.

### When **not** to add

- If v1 goal is **close Marvel/DC/DBZ arcs** first — cyber is a content multiplier.
- If legal review wants **zero robot factions** until homage audit template exists.

---

## Priority shortlist (next 12 implementations)

Ordered for **flight + arcs + rival density**, not fame alone.

| # | Codename | U | Role | Pairs / arc hook |
|---|----------|---|------|------------------|
| 1 | **Nth Wing** | DC | Hero | Sky Tyrant / Hawkgirl rivalry |
| 2 | **Cosmic Envoy** | Marvel | Hero | Titan Snap / stone hunt |
| 3 | **Vulture Scavenger** | Marvel | Villain | Shade Knight, Tin Aviator |
| 4 | **Goku Shade** | DBZ | Villain | Ki Wanderer / time Doom |
| 5 | **Magnetic Ace** | Marvel | Hero | Mirror Streak, Nimrod |
| 6 | **Scarab Pilot** | DC | Hero | Stark Nexus tech lattice |
| 7 | **Iron Monger Echo** | Marvel | Villain | Pin Tin Aviator |
| 8 | **Sunspot Flare** | Marvel | Hero | Sentinels / solar district |
| 9 | **Azure Patriarch** | Indie | Villain | Solar Apex / Undefeated Youth |
| 10 | **Undefeated Youth** | Indie | Hero | Azure Patriarch wave-10 |
| 11 | **Ember Dragon** | DBZ | Villain | Emperor Frieze / heat duels |
| 12 | **Crimson Ace** | Cyber | Hero | Deceit Winger (proto TF slice) |

**Transformers slice:** implement rows **11–12** plus **Deceit Winger** + district **`ion-foundry`** as a **milestone**, not row 1.

---

## Research sources (off-device)

Used for gap analysis only — not scraped into client:

- Marvel flight rosters (games + wiki category lists; innate vs gear).
- DC winged / Nth-metal characters ([CBR winged roundup](https://www.cbr.com/dc-character-wings-winged-hero-villain/), Hawkgirl / Power Girl summaries).
- DBZ GT antagonists with ki flight (shadow dragons, Ledgic, Baby arc).
- Image *Invincible* Viltrumite flight norms.
- Public domain flight catalog ([Eidolon Station flight powers index](https://eidolonstation.com/eidolon_posts/flight-powers/)).
- Transformers copyright posture ([TFWiki copyright notes](https://tfwiki.net/wiki/Copyright)) — distribution still needs homage-only posture.

---

## Doc map

| File | Use |
|------|-----|
| [`FLIGHT_NEMULATOR_FULL_ROSTER.md`](./FLIGHT_NEMULATOR_FULL_ROSTER.md) | Shipped codenames (regenerate audit) |
| [`FLIGHT_NEMULATOR_XMEN_RESEARCH.md`](./FLIGHT_NEMULATOR_XMEN_RESEARCH.md) | Mutant flight depth |
| [`FLIGHT_NEMULATOR_BATTLEWORLD_ARCS.md`](./FLIGHT_NEMULATOR_BATTLEWORLD_ARCS.md) | Arc + pair policy |
| [`BATTLEWORLD.md`](./BATTLEWORLD.md) | Player-facing overview |

When a row graduates to shipped: add `roster-mutations.ts`, `battleworld-arcs.ts`, aerial audit, and optional GLB in `public/models/heroes/`.
