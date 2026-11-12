# City Nights — personal playbook

Standalone night-driving app (`drive-world/`, **citynights** on Netlify). No Family Purpose / Google sign-in required. Optional anonymous cloud save via sync key in Settings.

## Success bar (for you)

You can **play for hours** without boot failures, without missing core loops (drive, unlock, meets, CPM), and without “lite” features turned off by default.

## Devices

iPhone Safari, iPad, Chromebook, desktop Chrome — same full game; presets only change **load** (fog, car counts), not which systems exist. Couch / Xbox Edge + controller: see [`CITY_NIGHTS_CONSOLE_FEEL.md`](./CITY_NIGHTS_CONSOLE_FEEL.md).

## Feedback

[Open a GitHub issue](https://github.com/esaddler1212-jpg/tortuca/issues/new?labels=city-nights&title=City%20Nights%20feedback) (label `city-nights`). In-game: Settings → **Send feedback**.

## Privacy-light analytics (opt-out in Settings)

Anonymous `cn-tel-*` id; periodic beacons with **session length**, quality preset, district, phase — no account, no sync key, no journal text. Aggregated daily on Netlify Blobs.

## Cloud save

**Yes** — optional pull/push with random sync key (unauthenticated by design). Enable Blobs on the City Nights site.

## Not in scope (for now)

- Iris / Alfred account linkage
- Tester save reset tooling
- Formal beta program

## Music (more tracks)

Procedural radio ships in-game; **playlist** has four OGG beds (toggle **Settings → Music → Use my playlist**). Regenerate or swap for ACE-Step on your GPU:

```bash
npm run ace-step:bootstrap
# in tools/ace-step/upstream: uv sync && uv run acestep-api
npm run ace-step:city-nights
```

No GPU handy: `npm run ace-step:city-nights -- --fallback-only` (ffmpeg ambient placeholders).

## Tokyo bonus map

Unlock the flight when you own **every Bay catalog car** (IDs starting with `tokyo-` don’t count) and **all six regions**. Board at **SFO** (pink gate), land at **Haneda**, then log **8 landmarks** in the **Fast & Furious–style Tokyo garage** — **one fan-tribute car per landmark** (Drift Monarch at Shibuya, Family Runner Van at Daikoku, **Shuto Night Runner** capstone at Odaiba). Headless: `cd drive-world && npm run test:tokyo`.

## Peer comparison

See [`CITY_NIGHTS_PEER_COMPARISON.md`](./CITY_NIGHTS_PEER_COMPARISON.md) (CPM2, Forza Horizon, Midnight Club LA vs what ships in the browser).

## Next engineering priorities

1. **Performance** — draw calls, hub hitch, VRAM (Chromebook-first)
2. **Hub street traffic** — local loops (shipped baseline)
3. **Coastal weather** — SF/Marin rain sheen toggle
