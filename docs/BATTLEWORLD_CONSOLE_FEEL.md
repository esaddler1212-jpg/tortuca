# Battleworld — couch funnel & QA (browser)

Battleworld stays **PlayCanvas in the browser** on VantageGames or local `npm run dev`. This doc is the **day-10 (bw-d10)** funnel and smoke reference—not an Xbox port.

## 15-minute funnel (signed)

| Phase | Do this | Pass if… |
|-------|---------|----------|
| **0–5 min** | `#tap-start` → hero roster live → read **Story** chip + `chapterChainObjective` | Objective text > 8 chars; codename on HUD |
| **5–15 min** | Hold **W** (or stick) → orbit rim → check minimap **H** + `arcObjectiveChip` → intro territory / first wave | Hero moved > 15 m or speed > 80 km/h; chapter chain visible |

**Come back tomorrow:** chapter **stones**, Magnetic Ace–class arc beat, wave-10 pair boss juice, offline autosave on `vantagegames1`.

## Controls (keyboard first; pad optional)

| Input | Action |
|-------|--------|
| WASD / arrows | Thrust / steer flight |
| Mouse | Look (when captured) |
| Tap `#tap-start` | Audio + boot (required user gesture) |

Gamepad: browsers vary; funnel QA is keyboard-first. Series couch can use Bluetooth + Edge (same as City Nights).

## Offline / VantageGames

`VITE_BATTLEWORLD_OFFLINE_BUNDLE=1` on console build → HUD autosave labels **offline (this device)**; lattice optional ([`VANTAGE_GAMES_DEPLOY.md`](./VANTAGE_GAMES_DEPLOY.md)).

## Automated smoke

```bash
cd flight-nemulator
npm run build && npm run test:playtest
```

Asserts: hero HUD, chapter chain, story chip, flight motion, minimap **H**, arc objective chip, zero page errors.

## Screenshot polish (optional)

Between funnel passes: [`GAME_POLISH_LOOP.md`](./GAME_POLISH_LOOP.md) — wave-10 pair moment or district rim still.