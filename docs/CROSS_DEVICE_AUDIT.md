# Cross-device audit (Chromebook · iPhone · iPad)

IRIS is one PWA with **three layout bands**, not three separate apps. Data and prefs live in **Netlify Blobs** + **localStorage** (`hudPrefs`), so the same account stays consistent everywhere you sign in.

## Layout bands

| Device | Typical viewport | UI band | Home experience |
|--------|------------------|---------|-----------------|
| **iPhone** | 390–430 × 844+ | `< 833px` (`lg`) | Stacked: gauges + core + up next; bottom tab bar; Iris dock above tabs when talking |
| **iPad portrait** | 768–820 × 1024+ | `< 833px` | Same as iPhone (intentional — thumb reach, no squeezed 3-column deck) |
| **iPad landscape** | 1024+ × 768+ | `≥ 833px` | **Command deck**: status \| core \| up next; filament orb in centre column |
| **Chromebook** | 1366×768+ | `≥ 833px` | Same as iPad landscape; tab bar widens to 1100px to match home |

Breakpoint source of truth: `tailwind.config.js` → `screens.lg: "833px"` (mirrored in `src/index.css` media queries).

## PWA shell

| Check | Where |
|-------|--------|
| Notch / home bar | `viewport-fit=cover`, `env(safe-area-inset-*)` on header + tab bar + scroll padding |
| iOS add-to-homescreen | `manifest.webmanifest`, `apple-mobile-web-app-*`, touch icons |
| Rotation | `orientation: "any"` — landscape unlocks command deck on iPad; Chromebook friendly |
| No input zoom | 16px fields on viewports `≤ 767px`; Focus `<select>` at 16px via overlay pattern |
| Reduce motion | `prefers-reduced-motion` in `index.css` slows HUD animations |

## Voice & touch (all devices)

- **Core ring / Iris:** first tap runs `voice.prime()` (required on iPhone for speech).
- **Tab bar:** `min-h-[52px]`; **Focus / settings:** ≥ 44px tap targets in header.
- **Lantern gate (daily):** full-screen iframe; skip button for dev without bootstrap assets.

## Combo HUD prefs

Settings → HUD: **Combo 1+3+5** toggles reactor skin (phone), command deck (≥833px), particle backdrop. **K.A.R.A. filament** only affects the centre core canvas.

## Automated gate

```bash
npm run test:devices   # layout contract only
npm run test:os        # full release gate (includes test:devices)
```

## Manual QA matrix (5 min)

1. **iPhone** — Home: tap core → listen/speak; open More → sheet clears Iris dock; scroll modules — content not hidden behind tab bar.
2. **iPad portrait** — Same as iPhone; confirm deck is **not** cramped 3-column.
3. **iPad landscape / Chromebook** — Home: three columns; orb + gauges; tabs span width; Today module + Iris inline when voice deck open.
4. **Cross-device** — Toggle todo on phone, open plan on Chromebook (signed in): Blobs sync via account (not instant offline — refresh if needed).

## Related docs

- [`HUD_ORB_LANTERN_AUDIT.md`](./HUD_ORB_LANTERN_AUDIT.md) — orb accent + daily lantern
- `README.md` — iPad PWA install blurb

## Sanity checklist (pre-merge)

- [ ] `npm run test:os` green
- [ ] Hard refresh after deploy (SW cache)
- [ ] Focus mode changes accent on all three bands
