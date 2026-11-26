# Dust Orb v2 (Ship Notes) — optional IRIS core

Upstream: https://github.com/aqualang89/shipnotes-components — path `components/dust-orb/v2/`  
Docs: https://aqualang89.github.io/shipnotes-components/components/dust-orb/

**MIT.** Not vendored in git until you copy files deliberately (Three.js is large).

## Local preview (before vendoring into Tortuca)

```bash
git clone --depth 1 https://github.com/aqualang89/shipnotes-components.git /tmp/shipnotes-components
cd /tmp/shipnotes-components/components/dust-orb/v2
python3 -m http.server 8080
# open http://127.0.0.1:8080/
```

## Vendoring into Tortuca (future PR)

1. Copy entire `v2/` tree to `public/vendor/dust-orb/` (keep `vendor/THREE-LICENSE.txt`).
2. Do **not** copy `demo.js` into the PWA load path.
3. In React, load in order:
   - `three-r180.js`, `motion.js`, `material.js`, `dust-orb.js`
4. Mount:
   ```html
   <dust-orb id="iris-dust" style="display:block;width:100%;height:min(420px,70vw)"></dust-orb>
   ```
5. Drive from `mapIrisToDustOrb()` in `shared/dustOrbBridge.ts` + `useVoiceSignal()`.

## Device guidance

| Device | Suggested `setQuality` |
|--------|-------------------------|
| iPhone portrait | Prefer filament default; if dust: `16000` or `auto` |
| iPad landscape | `auto` or `40000` |
| Chromebook | `auto` |
| Old iPad | Watch `stats` fps; force `16000` if &lt; 30 fps |

## Deep dive

[`docs/DEEP_DIVE_DUST_ORB.md`](../../docs/DEEP_DIVE_DUST_ORB.md)