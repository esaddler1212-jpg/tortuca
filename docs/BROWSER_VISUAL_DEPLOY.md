# Browser game — visual assets on Netlify

City Nights and Battleworld are **static browser games** (Vite → `dist/`). Anything under each app’s `public/` folder is served to players at your URL. **Players never run install scripts.**

## What ships without extra steps

Already **committed** and present in every deploy:

- Kenney **car** GLBs, helicopter, Tier 6 service vehicles
- **Hero** GLBs (Kenney minis + procedural builds)
- World Gacha **modular skyline** fallback (`worldgacha/bay-modular-*.glb`)

That is enough to play; districts still look good with procedural art kits.

## What needs the build step (optional density)

Kenney **city / nature / roads / suburban**, deck + building **PBR**, and Battleworld **interface audio** live in gitignored folders. They are filled by `install-free-packs.sh` on the **build machine** so the published site includes them.

## What you configure (once per Netlify site)

Sites that bundle the console should run the installer **before** `npm run build` / `build:all` / `build:with-console`:

```bash
bash tools/gamedev-resources/netlify-visual-assets.sh
```

This is already wired in:

| Netlify site (base dir) | Build command (includes asset fetch) |
|-------------------------|--------------------------------------|
| `games-hub/` | `npm ci && bash ../tools/gamedev-resources/netlify-visual-assets.sh && npm run build:all` |
| `vantage-games/` | same pattern via `build:with-console` → games-hub |
| `drive-world/` (standalone City Nights) | `npm ci && bash ../tools/gamedev-resources/netlify-visual-assets.sh && npm run build` |

Requirements on Netlify builders: `bash`, `curl`, `unzip`, `python3`, `git` (default on Netlify Ubuntu image).

### Local parity with production

```bash
bash tools/gamedev-resources/netlify-visual-assets.sh
cd games-hub && npm run build:all
```

Or force install during any local console build:

```bash
INSTALL_VISUAL_ASSETS=1 npm run build:all
```

(in `games-hub/`)

### If downloads fail in CI

Build continues with in-git assets (see warnings in the log). Fix network or mirror Kenney zips, then redeploy. `npm run test:couch-pass-preflight` documents what’s present on disk.

## Credits

CC0 packs — cite Kenney / AmbientCG in shipped `CREDITS.md` when you publish broadly.