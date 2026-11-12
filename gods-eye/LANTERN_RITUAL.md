# Lantern oath ritual (God's Eye companion)

The **Futurist Lantern** daily charge flow was removed from the IRIS home screen. It lives here for **God's Eye** and future Vitals rituals.

## Assets

```bash
npm run lantern:bootstrap   # → public/lantern/ (gitignored, CC BY-NC)
```

Copy `public/lantern/` into the God's Eye static host or serve it from the same origin as IRIS so `/lantern/index.html?irisEmbed=1&irisTheme=<focus>` resolves.

## React embed (IRIS repo)

`src/components/godsEye/LanternRitualGate.tsx` — full-screen iframe + skip. Wire it from God's Eye View or a Pulse "Charge" entry when you are ready:

```tsx
import { LanternRitualGate } from "../src/components/godsEye/LanternRitualGate";
```

Unlock state: `src/lib/lanternRitual.ts` (`gods-eye-lantern-unlock-<day>` in localStorage).

## Oath text

[`futurist-lantern/IRIS_OATH.md`](../futurist-lantern/IRIS_OATH.md) — John's lantern lines; bootstrap patches TTS in embed mode.

## Netlify

IRIS production builds **no longer** run `lantern:bootstrap` by default. Run bootstrap locally or add it to your God's Eye deploy when you ship the ritual.
