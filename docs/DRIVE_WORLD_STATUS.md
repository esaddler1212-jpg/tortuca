# City Nights — status

_Product name **City Nights**; code lives in `drive-world/`._

Stack: **PlayCanvas** + **Ammo** + **React HUD** · save data **v9** (storage key `drive-world-progress-v5`)

## Shipped

| Area | Notes |
|------|-------|
| Prologue + onboarding | Cinematic Waymo (drone → passenger), 4 starters, one pinned objective until Vallejo taco + landmark opens the Bay |
| Driving | Headlights / brake glow, nitro, gamepad, touch pad, chase / cockpit / drone cams, garage interior cam |
| Fleet | Kenney CC0 GLBs: starters, region cars, parking rewards, activity cars, district meet cars, craft shard cars, homage legends, aerial |
| Loops | Parking stars, drag, drift, time attack, landmark sprints, ghost PBs, courier, dyno, speed traps + heat chaser, sideshow meets |
| World | Bay freeways + ramps, 37+ landmarks, hub streaming (time-sliced), freeway + hub street traffic, regional fog, coastal rain (SF/Marin) |
| HUD | Tabbed drawer, minimap, nav with grade hints, city search, journal, photo mode, CC0 music playlist |
| Saves | Local + optional cloud sync key (throttled), JSON import/export, renamed-vehicle migration |
| Ops | `npm run test:smoke` headless boot in CI, opt-out anonymous play-time rollups, GitHub feedback link |

## Still open

| Item | Notes |
|------|-------|
| Draw-call / VRAM pass | Batch static hub geometry; texture downsample for Chromebook |
| Chase cam vs buildings | Terrain + physics raycast shipped; tight garages can still clip |
| Oracle Park / Chase Center overlap | 12 m apart on the compressed map |
| `game-loop.ts` size | 1,400+ lines; split per system before large additions |
| Unit tests | No Vitest in `drive-world/` yet |

Deploy: [`CITY_NIGHTS_DEPLOY.md`](./CITY_NIGHTS_DEPLOY.md) · Audit: [`CITY_NIGHTS_AUDIT.md`](./CITY_NIGHTS_AUDIT.md) · Playbook: [`CITY_NIGHTS_PLAYBOOK.md`](./CITY_NIGHTS_PLAYBOOK.md)
