# Futurist Lantern → IRIS daily unlock

Upstream: [htongyai/futurist-lantern](https://github.com/htongyai/futurist-lantern) · live [augmaimaginarium.com/lantern](https://augmaimaginarium.com/lantern/).

Part of **Augma Repo** — **CC BY-NC 4.0**. Tortuca does **not** commit the GLB/WAV blobs; bootstrap clones them into `public/lantern/` for local/PWA hosting.

## Bootstrap

```bash
npm run lantern:bootstrap
```

Then reload the PWA. First open each day (when enabled in **Settings → HUD**) shows the lantern full-screen until you finish the oath or tap **Skip**.

**Netlify production** runs `lantern:bootstrap` before every build (`netlify.toml`), so you do not need a local bootstrap for the live site.

## IRIS embed patch

The bootstrap applies a small patch so the parent window receives:

```json
{ "type": "iris:lantern-complete" }
```

when the oath climax finishes (`?irisEmbed=1` also hides the quality button).

## IRIS oath (John’s lantern text)

See **`IRIS_OATH.md`**. Bootstrap replaces on-screen copy and uses browser TTS for those lines in embed mode (so audio matches the words).

## Combo 1 + 3 + 5

| Piece | Where |
|-------|--------|
| **1 Reactor** | Phone home: red reactor skin + hold-to-talk core |
| **3 Command deck** | iPad (`≥833px`): status \| core \| up next |
| **5 Particle** | Viz behind the ring; picker on home (Orbits / Cortex / Strata) |
| **Unlock** | Lantern gate once per day before HUD |

Toggle combo and particle in **Settings → HUD layout**.
