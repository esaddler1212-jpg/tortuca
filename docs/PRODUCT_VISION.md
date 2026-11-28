# VantageGames — product vision (owner, Nov 2026)

Single source for **what “done” means for the boys** — not CI slice completion. Engineering gates stay; this doc steers polish.

## North star

| | Choice |
|---|--------|
| **Platform** | Phone **landscape** first |
| **URL** | https://vantagegames1.netlify.app |
| **Scope** | **City Nights + Battleworld only** (no Trustfund code until both pass couch) |

## Done = ranked

1. They **want to play again tomorrow**
2. **One wow moment** per game per session
3. **Looks like a real game** (roads, cities, GLBs — not blocks)
4. **~20 min without parent help**

## City Nights

| Dimension | Target |
|-----------|--------|
| **Feel** | **Explore** the Bay (tacos, landmarks, chapters) **and** **street drive** (freeway, heat, ghosts, nitro) |
| **Look** | **Semi-real night roads** + **denser city** on screen (GTA-ish props, not grey prototype) |
| **Wow** | Pick: **map unlock** after Chapter 1 · first **freeway nitro** · **ghost PB** toast |
| **Phone** | Landscape, Balanced quality, touch drive, [`PHONE_FIRST_10.md`](./PHONE_FIRST_10.md) |

## Battleworld

| Dimension | Target |
|-----------|--------|
| **World** | **3D globe** — fly between **homage cities** on one planet (see [`BATTLEWORLD_GLOBE_VISION.md`](./BATTLEWORLD_GLOBE_VISION.md)) |
| **Feel** | **Arcade + superhero** — Spider-Man **energy**, but **fly** (thrust on input, boost swoops) |
| **Wow** | Arrive at **home city** · first **territory clear** · wave finale juice |
| **Build flag** | `VITE_BATTLEWORLD_GLOBE=1` on console / vantagegames1 |

## Execution tracks (current)

| ID | Track | Verify |
|----|--------|--------|
| PV-1 | `PRODUCT_VISION.md` + deploy checklist | this file |
| PV-2 | CN phone defaults + first-10 coach | `PHONE_FIRST_10.md` + playtest |
| PV-3 | BW globe spike 1 + flight feel | `test:playtest` + globe shell visible |
| PV-4 | CC0 visuals on Netlify | `INSTALL_VISUAL_ASSETS=1` in vantage-games build |

## Owner wow picks (fill when decided)

- **City Nights wow:** _freeway nitro / map unlock / ghost PB / Tokyo tease_
- **Battleworld wow:** _city arrival / territory / wave-10_

_Iris / agents: do not add roster arcs until PV-4 green on vantagegames1._