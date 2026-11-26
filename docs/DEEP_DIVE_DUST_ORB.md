# Deep dive: Ship Notes Dust Orb v2

**Demo:** [Dust Orb v2](https://aqualang89.github.io/shipnotes-components/components/dust-orb/)  
**Source:** [aqualang89/shipnotes-components](https://github.com/aqualang89/shipnotes-components) (`components/dust-orb/v2/`) — **MIT**

## What it is

A **Web Component** (`<dust-orb>`) — Three.js r180 dust cloud + inner light, cursor attraction, drag-to-rotate, tap pulse. **Five assistant states** map cleanly to Iris:

| Dust Orb `setState` | Tortuca today (`CoreRing` / conversation) |
|---------------------|-------------------------------------------|
| `idle` | Idle, greeting waiting, conversation closed |
| `listening` | STT active (`phase === "listening"`) |
| `thinking` | `/api/ask` in flight |
| `speaking` | TTS + `useVoiceSignal().speaking` |
| `agitated` | Ask error, quota, or `status === "degraded"` |

Aliases: `processing` → thinking, `talking` → speaking, `waiting` → idle.

**Extras:** `setVoiceLevel(0–1)` for lip-sync feel, `setQuality('auto'|…)` for Chromebook/old iPad, **Canvas 2D fallback** when WebGL fails, **pauses when tab hidden** (good for PWA battery).

**Do not load `demo.js` in production** — it runs a scripted voice loop that will fight Iris TTS.

## Fit for IRIS HUD

| Pro | Con |
|-----|-----|
| Purpose-built **AI face** API | **~Three.js bundle** — conflicts with Tier 4 “keep 2D filament default” |
| State + voice level hooks | Heavier than `KaraFilamentOrb` canvas on weak iPads |
| MIT, no API key | Another visual lane beside cinema-eye / filament (prefs explosion) |
| Optional Air+glass SFX | Extra audio policy (user mute, school hours) |

**Recommendation (aligned fleet + Jan 2027):**

1. **Now:** Keep **K.A.R.A. filament** (`CoreRing` + combo HUD) as default on all devices — proven on `test:devices`.
2. **Pilot:** Optional **“Dust core”** in HUD settings on **iPad landscape + Mac** only; lazy-load scripts when selected (not in main Vite chunk).
3. **Wire:** `shared/dustOrbBridge.ts` maps conversation → `setState` / rough `setVoiceLevel` from `useVoiceSignal`.
4. **Skip sound** in PWA v1 (Iris already has TTS); add glass cues later if muted=false and user toggles.

## vs other orb work

- **cinema-eye / 10 styles** (branch `cursor/iris-orb-update-930a`): mostly **2D/SVG/CSS** — ship first as default identity.
- **Dust Orb:** **3D premium** slot — best as **opt-in** for command deck, not phone portrait (thermal + size).

## Vendor steps (when you approve integration)

See [`tools/dust-orb/README.md`](../tools/dust-orb/README.md):

1. Copy `v2/` from upstream (MIT + `THREE-LICENSE.txt`).
2. Host under `public/vendor/dust-orb/` (not npm — avoids duplicate Three).
3. React wrapper loads four scripts once, mounts `<dust-orb>`, calls `destroy()` on unmount.
4. MAYA Sentinel: zip upstream folder with `tools/maya-sentinel/zip-repo-for-scan.sh` before first vendor (supply-chain + ai-surface N/A for static assets).

## Iris optimization note

Dust Orb does **not** make Iris smarter — it makes **state visible**. Pair with existing discipline: fast path voice intents, one Scout run, Revenue line in brief. Use `pause(true)` when More sheet covers the core so WebGL idles.

## Related

- [`IRIS_IMPROVEMENTS_RESEARCH.md`](./IRIS_IMPROVEMENTS_RESEARCH.md) — Tier 4 Three.js orb
- [`CROSS_DEVICE_AUDIT.md`](./CROSS_DEVICE_AUDIT.md) — 833px command deck
- [`CHERRY_PICK_OPEN_SOURCE.md`](./CHERRY_PICK_OPEN_SOURCE.md)