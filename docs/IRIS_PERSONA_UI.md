# IRIS persona UI — JARVIS · FRIDAY · Ultron

Inspiration pass for **best HUD UX** without abandoning the Netlify PWA or Claude guardrails. Names are **MCU design personas**, not separate products to merge (see [`jarvis-os-v2/CHERRY_PICK.md`](../jarvis-os-v2/CHERRY_PICK.md)).

## What “Ultorn” usually means

Most references are **Ultron** (Age of Ultron UI by Territory Studio): angular red diagnostics, threat overlays, procedural wireframe “consciousness.” Open-source clones ([SAGAR-TAMANG/ultron-by-sagar-builds](https://github.com/SAGAR-TAMANG/ultron-by-sagar-builds), [AbuZar-Ansarii/Ultron](https://github.com/AbuZar-Ansarii/Ultron)) add **Three.js orbs**, task modes (`CODE`, `SENTRY`, …), and heavy red IoT theming — great for demos, wrong as IRIS’s default home.

## FRIDAY references worth knowing

| Source | What to steal for UI only |
|--------|---------------------------|
| [friday-tony-stark-demo](https://github.com/SAGAR-TAMANG/friday-tony-stark-demo) (MIT, ~1.6k ★) | **Split brain**: fast voice loop + tool server (IRIS already has client + `/api/ask` + specialists). Desktop installers — not for PWA. |
| Contra-style Jarvis/Friday **toggle** | Two **visual + copy personas**: calm Jarvis vs brighter, quicker Friday — same backend. |
| Territory / Sci-fi HUD articles | **Peripheral → central**: gauges stay small until the task needs them ([scifiinterfaces](https://scifiinterfaces.com/2015/07/21/iron-man-hud-1-person-view/)). |

## Three personas → one IRIS (recommended mapping)

IRIS stays **one chief of staff**. Personas are **skins + motion + copy**, toggled in Settings or auto by Focus:

| Persona | MCU role | UI job for IRIS | Signal color | When |
|---------|----------|-----------------|--------------|------|
| **JARVIS** | Calm strategist | Default home, command deck, modules | Cyan hairlines on black (current) | School hours, planning, “explain” |
| **FRIDAY** | Field ops, faster banter | Voice dock, Today, commute urgency | Same hue family, **+8% luminance**, slightly faster scan/pulse | Network mode, listening/speaking |
| **Ultron** | Diagnostics / threat | **Never** default chrome — audit, weekly fail, degraded status | Red/amber angular brackets, sharper corners | `systemStatus !== ok`, guardrail block, Team auditor |

Do **not** ship a full red home orb — that reads hostile and fights your accent Focus palettes (green/purple weekends).

## IRIS today vs “best HUD”

| Pattern | You have | Gap |
|---------|----------|-----|
| Central instrument + corner gauges | `HudCore` + `CoreRing` / K.A.R.A. filament | **Context expansion**: tap gauge → module opens *with* a single relevant metric enlarged (GenUI “HUD swap”) |
| Voice cinema strip | `JarvisCinemaBar` + scan line + phase pills | **FRIDAY pass**: mobile face strip already exists; add subtle **horizontal tick ruler** + `PROCESSING` thread id (cosmetic) |
| Focus theming | `data-focus` cyan / green / purple | **Persona layer** orthogonal to focus: `data-voice-persona="jarvis|friday"` for motion only |
| Peripheral density | Four gauges always visible | **JARVIS minimal**: hide gauge fill animation until alert; expand caption on `prefers-reduced-motion` |
| Ultron orb (Three.js) | 2D canvas filament | Optional **WebGL layer** behind core only at `lg+` and `prefers-reduced-motion: no` — borrow layering from [ultron-by-sagar-builds](https://github.com/SAGAR-TAMANG/ultron-by-sagar-builds), keep accent from CSS vars |
| Atticus / desktop | — | Mac-only; IRIS PWA wins on **cross-device** ([`CROSS_DEVICE_AUDIT.md`](./CROSS_DEVICE_AUDIT.md)) |
| Friday MCP voice desktop | LiveKit + FastMCP | Inspiration for **barge-in** polish in `useConversation`, not new stack |

## Pull list (ranked for PWA)

### Tier 1 — High impact, low risk

1. **`data-voice-persona` CSS** — Jarvis (default) vs Friday (brighter accent, 1.15× cinema scan speed, Orbitron tracking +0.05em on labels).
2. **`data-system-tier="degraded|offline"`** — Ultron-lite: chamfered amber/red corner brackets on `GlassModule` + header status only.
3. **GenUI home** — When opening a module from a gauge, animate that gauge’s callout to “hero” width for 400ms (already have `hud-callout` stroke-dash).
4. **Streaming subtitle** — Word-by-word emphasis in cinema bar while speaking (CSS, no new API).

### Tier 2 — Medium

5. **Task mode chip** above core when Iris uses a tool (`consult_specialist`) — mimics Ultron HUD mode labels without red skin.
6. **Minimize dock to step bar** (Atticus pattern): collapsed Iris dock shows last 2 tool steps as monospace ticks.
7. **“Show me where”** on Pulse map only — ring reticle on selected pin (screen-Q&A is out of scope for mobile PWA).

### Tier 3 — Heavy / Mac sidecar

8. Three.js orb shell (deferred).
9. Hand-gesture orb (desktop only, wrong for phone).
10. Import F.R.I.D.A.Y. LiveKit stack (duplicate of Iris voice).

## External repos (look, don’t fork into Tortuca)

| Repo | License | Use |
|------|---------|-----|
| [SAGAR-TAMANG/friday-tony-stark-demo](https://github.com/SAGAR-TAMANG/friday-tony-stark-demo) | MIT | Architecture diagram for voice + tools |
| [SAGAR-TAMANG/ultron-by-sagar-builds](https://github.com/SAGAR-TAMANG/ultron-by-sagar-builds) | Check repo | Orb layering / bloom ideas for canvas |
| [SaarthurR/atticus-mac](https://github.com/SaarthurR/atticus-mac) | MIT | Minimize-to-step-bar, wake word (Mac) |
| [htongyai/futurist-lantern](https://github.com/htongyai/futurist-lantern) | CC BY-NC | Daily unlock ritual (already integrated) |

## Design rules (Jarvis UI skill distilled)

- **One hue carries the light** — amber/red = status only (matches your gauges).
- **No cyberpunk noise** — skip matrix rain, glitch fonts, constant bloom.
- **12px+ type**, 44px+ taps (already in cross-device audit).
- **Stability mandate** — persona changes on user choice or Focus, not every token.

## Suggested default for E

**JARVIS chrome + FRIDAY motion on voice + Ultron brackets on degraded/audit** — keeps IRIS feeling like *one* system, with Friday energy when she’s talking and Ultron seriousness when something’s wrong.

## Next implementation branch

When you want this in code: `cursor/iris-persona-skin-930a` — CSS tokens in `index.css`, `HudPrefs.voicePersona`, wire `JarvisCinemaBar` + `HudHeader` to `data-voice-persona`, Ultron corners on `GlassModule` when `systemStatus !== 'ok'`.
