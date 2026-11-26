# Astryx pilot (deferred)

Upstream: https://github.com/meta/astryx (MIT). Tortuca already uses **React 19**; the blocker is **visual identity** (Iris HUD / orb), not React version.

## When to run this folder

After Jan 2027 Revenue OS is live and you want a **neutral admin surface** (e.g. printable revenue month report) without touching `hud-*` styles.

## Suggested steps (not automated)

```bash
# Outside tortuca root — keep pilot isolated
mkdir astryx-revenue-sandbox && cd astryx-revenue-sandbox
npm create vite@latest . -- --template react-ts
npm install @astryxdesign/core @astryxdesign/theme-neutral @stylexjs/stylex
npm install -D @astryxdesign/cli
npx @astryxdesign/cli init
```

Port patterns back into Tortuca only after a design review. Do **not** add `@astryxdesign/core` to the main `package.json` until then.

Reference: [`docs/DEEP_DIVE_SURE_ASTRYX.md`](../../docs/DEEP_DIVE_SURE_ASTRYX.md).