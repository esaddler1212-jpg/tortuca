# HUD orb + lantern audit (IRIS combo 1 · 3 · 5)

Last pass: theme accent wiring, daily unlock theming, deploy path. Use this when debugging “orb still the wrong color” or lantern still feeling Futurist/Augma.

## Stack map

```
App.tsx
├── dataset.focus = mode (school | network | weekend | holiday | vantage)
├── HudHomeCommandDeck (lg) — combo 1+3+5
│   └── CoreRing kara={combo135 && karaOrb}
│       └── KaraFilamentOrb ← useHudAccent() → CSS --accent-*
├── ParticleCoreBackdrop (combo particle viz; uses accent utilities)
└── LanternUnlockGate (?irisEmbed=1&irisTheme=<mode>)
        └── public/lantern/index.html (bootstrap clone, CC BY-NC)
```

| Pref (`hudPrefs`) | Default | Effect |
|-------------------|---------|--------|
| `combo135` | on | Reactor layout + command deck + particle slot |
| `karaOrb` | on | Filament canvas instead of static cyan “eye” |
| `particleViz` | `orbits` | Behind-ring particles |
| `lanternUnlock` | on | Once-per-day full-screen gate |
| `reactorSkin` | on | Phone hold-to-talk chrome (accent-themed, not hard-coded pink) |

Storage: `src/lib/hudPrefs.ts` (localStorage, `_v` migrations).

## Focus → accent (orb + chrome)

`src/index.css` defines `--accent-300`…`600` per focus:

| `data-focus` | Accent | Typical hours |
|--------------|--------|----------------|
| `school` | Cyan | Default / class time |
| `network` | Green | ECS Network afternoons |
| `weekend`, `holiday`, `vantage` | Purple | Off-duty / holidays / Vantage |

`App.tsx` sets `document.documentElement.dataset.focus` from `resolveMode(autoMode, focus.choice)`.

**Orb colors:** `useHudAccent` + `MutationObserver` on `data-focus` → `CoreRing` → `KaraFilamentOrb` props. Canvas reads `accentForFocus()` each frame (no stale pink filaments).

**Why it can look “unchanged”:**

1. **School mode** — cyan is correct; switch **Focus** in the header (network = green, weekend = purple).
2. **Prefs** — Settings → HUD: **Combo 1+3+5** and **K.A.R.A. filament orb** must be on.
3. **Where** — Filament orb is on **home** (lg command deck), not inside every module.
4. **PWA cache** — hard refresh after deploy; service worker may serve old JS.

## Lantern unlock

1. `npm run lantern:bootstrap` clones [futurist-lantern](https://github.com/htongyai/futurist-lantern) → `public/lantern/` (gitignored).
2. **Netlify:** `netlify.toml` runs `lantern:bootstrap` before `build`.
3. `futurist-lantern/bootstrap.sh` patches:
   - John's lantern oath (HTML + TTS via `__IRIS_EMBED_OATH`)
   - `postMessage({ type: 'iris:lantern-complete' })`
   - Embed UX: IRIS load copy, charge prompts, `irisTheme` hue map
4. Copy: `futurist-lantern/IRIS_OATH.md`

**License:** CC BY-NC 4.0 — do not commit upstream assets; bootstrap on CI.

## QA checklist

- [ ] Home lg: filament orb visible with combo + kara prefs on
- [ ] Change Focus → orb glow + filaments shift (green / purple)
- [ ] Iris speaking → pulse + drift energize
- [ ] Clear lantern day → gate loads; oath lines match IRIS text; hue matches focus
- [ ] `npm run test:os` (includes HUD audit checks)

## Cross-device

See [`CROSS_DEVICE_AUDIT.md`](./CROSS_DEVICE_AUDIT.md) for Chromebook / iPhone / iPad layout bands and QA.

## Related PRs (historical)

#82 combo HUD + gate, #83 Netlify bootstrap, #84 accent orb, #85 omnidirectional motion, theme/lantern audit branch.
