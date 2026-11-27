# Family couch smoke — vantagegames1

**URL:** https://vantagegames1.netlify.app  
**Automated:** `npm run smoke:vantagegames1` (HTTP + optional Chrome)

## Phone (390×844 portrait)

1. Open **`/console/city-nights/`** — tap **City Nights** → **Tap to start**
2. Skip Waymo if shown · pick **garage cruiser**
3. **Missions** tab default · **RT** drive if gamepad paired via Bluetooth
4. Confirm **mph**, **heat bar**, and **nitro** strip readable (no overlap with minimap)
5. Open **Map** — sim pauses · second tap **Missions** resumes

## Phone — Battleworld

1. **`/console/flight-nemulator/`** → tap start · hero loads
2. **W** fly · **Shift** boost · chapter chips visible without scrolling

## Xbox / TV (1280×720)

1. **`/console/`** — both tiles load; d-pad focus if using browser on console
2. City Nights: enable **Console** quality preset in Settings if FPS low
3. Battleworld: verify **Story** chip and **H** home pin on minimap

## Pass criteria

- No blank canvas after tap start (60s)
- Save persists after refresh on same device
- Audio optional — mute OK for smoke

After Netlify deploy from `main`, run `smoke:vantagegames1` before telling boys to play.