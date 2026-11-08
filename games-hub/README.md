# Tortuca Console

PlayStation-style **home screen** for the two browser games in this repo:

| Tile | Path | Source |
|------|------|--------|
| **City Nights** | `/city-nights/` | [`drive-world/`](../drive-world/) |
| **Flight Nemulator** | `/flight-nemulator/` | [`flight-nemulator/`](../flight-nemulator/) |

## Dev (launcher only)

Tiles link to subfolders; use `build:all` before preview so both games are present.

```bash
cd games-hub
npm install
npm run dev          # launcher UI only
npm run build:all    # hub + both PlayCanvas apps
npm run preview
```

## Deploy

Separate Netlify site with **base directory** `games-hub` (`npm run build:all` is the default build command in `netlify.toml`).

## Controls

- **Keyboard:** ← → to highlight a game, **Enter** to play  
- **Gamepad:** D-pad / left stick to browse, **Cross (A)** to play  
- **Touch:** tap a tile to launch  

Each game shows **◯ Console** (top-left) when launched from this bundle to return home.
