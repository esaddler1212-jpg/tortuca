#!/usr/bin/env bash
# Fetch CC0 visual packs into game public/ folders during Netlify (browser deploy).
# Players never run this — only CI/build. See docs/BROWSER_VISUAL_DEPLOY.md
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INSTALL="$ROOT/tools/gamedev-resources/install-free-packs.sh"

if [ ! -x "$INSTALL" ] && [ -f "$INSTALL" ]; then
  chmod +x "$INSTALL"
fi

echo "→ netlify-visual-assets: CC0 packs for browser build…"
bash "$INSTALL" --all --city-glb-full \
  --pbr-decks --nature-glb --roads-glb --suburban-glb --building-pbr \
  || {
    echo "WARN: install-free-packs.sh exited nonzero — continuing with in-git assets only"
  }

echo "→ netlify-visual-assets done"