# City Nights — console / Xbox feel (browser)

City Nights stays **PlayCanvas in the browser**. This doc covers couch + controller polish, not an Xbox GDK build.

## Controller (pad 0, standard mapping)

| Input | Action |
|-------|--------|
| Left stick X | Steer |
| RT / LT | Gas / brake + reverse (left stick Y also works) |
| A (hold) | Nitro |
| Right stick Y / D-pad ↑↓ | Climb / descend (aircraft) |
| LB / RB (or D-pad ←→) | Previous / next camera |
| Y | Photo mode (B exits) |
| X | Autopilot (Night Coil) |
| A | Skip Waymo prologue / sightseeing replay (while riding) |
| Menu (Start) | Map tab + pause — press again to resume |
| View (Back) | Settings tab + pause — press again to resume |
| B | Resume (back to Missions), exit photo mode, end replay |

Boot: **A** or **Start** on the title overlay. Browsers do not treat pad buttons as a user gesture, so audio starts on the first key press, click, or tap.

## Pause semantics

Map / Garage / Settings tabs during free roam set `app.timeScale = 0` (physics and scripts stop) and lock vehicle input. A **Paused** banner shows the resume button. Photo mode runs the world at 0.38× and also locks the car.

## Settings

- **Console / TV** preset — 30 fps cap, 85% resolution scale, TV HUD.
- **SFX / engine** — separate from music (Music panel still has station volume).
- **Frame cap** — caps GPU draws (`autoRender` + `renderNextFrame`); the simulation still ticks every frame.
- **Resolution scale** — performance vs quality.
- **TV / couch HUD** — larger drawer type.

## Records

Garage tab → **Records · trophies** — landmarks, unlocks, parking stars, heat peak, mastery.

## Haptics

Dual-rumble on nitro, drag GO, parking stars, and heat chase (when supported).

## Tests

`npm run build && npm run test:playtest` in `drive-world/` — headless Chrome with SwiftShader WebGL and a stubbed gamepad: prologue skip → car pick → RT/LT/W drive → pause freezes the car → resume → frame cap keeps the sim ticking.

## Test couch

Xbox **Edge** on Series console → your City Nights URL + Bluetooth controller.
