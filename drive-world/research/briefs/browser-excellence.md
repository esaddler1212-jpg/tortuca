# Brief: best-in-browser driving game (City Nights)

Paste into Craft **`core_brief_write`** (edit targets and URLs).

## Question

What should **City Nights** (`drive-world/`, PlayCanvas + Ammo + React HUD, Netlify PWA) change to be among the **best browser-based** open-world driving experiences on **Chromebook, iPhone, and desktop Chrome**?

## Constraints

- Answers must be **evidence-backed** (Craft evidence ids).
- **Clean room** for implementation: recommendations become edits in **this repo only** — no copying third-party art, audio, logos, or code.
- Do **not** study DRM games, logged-in commercial clients, or APK/IPA binaries unless the user explicitly owns them and consents.
- Prefer targets: **our deployed build**, **local `npm run dev`**, **PlayCanvas/MDN docs**, **OSS web demos**, **our own `dist/` bundles**.

## Targets (fill in)

1. Production City Nights URL: `________________`
2. Local dev (optional): `http://127.0.0.1:5173/`
3. Reference docs: PlayCanvas performance + input; MDN Web Audio / touch / PWA.

## Done when

- ≥8 findings covering: mobile GPU, input latency, audio policy, load time, HUD readability, physics stability, offline/PWA, accessibility.
- Each finding has ≥1 evidence id and a **Tortuca file path** suggestion.
- Handoff lists top **3 P0** changes for the next coding agent.

## Toolsets to enable

`browser`, `javascript`, `web` (as available).

## Output for Tortuca

Write summary to `drive-world/research/findings/YYYY-MM-DD-browser-excellence.md`.
