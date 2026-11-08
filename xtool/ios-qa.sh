#!/usr/bin/env bash
# Optional physical-device QA helper for Iris iOS testing.
# Iris ships as a PWA on Netlify; xtool helps when you build a native SwiftPM shell
# or sideload test IPAs — see xtool/CHERRY_PICK.md.

set -euo pipefail

echo "IRIS iOS QA — PWA first"
echo "  1. Open the deployed site in Safari → Share → Add to Home Screen"
echo "  2. Run: npm run test:devices"
echo "  3. Follow docs/CROSS_DEVICE_AUDIT.md (iPhone + iPad portrait/landscape)"
echo ""

if ! command -v xtool >/dev/null 2>&1; then
  echo "xtool CLI not on PATH (skip native device list)."
  echo "Install: https://xtool.sh/documentation/xtooldocs/installation-macos"
  exit 0
fi

echo "xtool version:"
xtool --version 2>/dev/null || true
echo ""
echo "Connected devices (xtool devices list):"
xtool devices list 2>/dev/null || xtool devices 2>/dev/null || echo "(run 'xtool auth' / 'xtool setup' if this fails)"
