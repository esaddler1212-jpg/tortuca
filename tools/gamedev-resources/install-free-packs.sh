#!/usr/bin/env bash
# Install optional CC0 packs for Tortuca PlayCanvas games (not committed to git).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FLIGHT="$ROOT/flight-nemulator/public"
AUDIO_DIR="$FLIGHT/audio/kenney"
CITY_DIR="$FLIGHT/models/kenney-city"

INSTALL_AUDIO=false
INSTALL_CITY=false

for arg in "$@"; do
  case "$arg" in
    --audio) INSTALL_AUDIO=true ;;
    --city-glb) INSTALL_CITY=true ;;
    --all) INSTALL_AUDIO=true; INSTALL_CITY=true ;;
    -h|--help)
      echo "Usage: $0 [--audio] [--city-glb] [--all]"
      exit 0
      ;;
  esac
done

if ! $INSTALL_AUDIO && ! $INSTALL_CITY; then
  echo "Pick at least one: --audio --city-glb"
  exit 1
fi

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

if $INSTALL_AUDIO; then
  mkdir -p "$AUDIO_DIR"
  echo "Fetching Kenney Interface Sounds (CC0)…"
  urls=(
    "https://kenney.nl/media/pages/assets/interface-sounds/interface-sounds.zip"
    "https://opengameart.org/sites/default/files/interface_sounds.zip"
  )
  got=false
  for u in "${urls[@]}"; do
    if curl -fsSL -A "Mozilla/5.0 (compatible; TortucaAssetInstaller/1.0)" "$u" -o "$tmpdir/interface-sounds.zip"; then
      got=true
      break
    fi
  done
  if $got; then
    unzip -qo "$tmpdir/interface-sounds.zip" -d "$tmpdir/if"
    find "$tmpdir/if" -type f \( -name '*.ogg' -o -name '*.wav' -o -name '*.mp3' \) -exec cp -n {} "$AUDIO_DIR/" \;
    echo "Installed $(find "$AUDIO_DIR" -type f | wc -l) files → $AUDIO_DIR"
  else
    echo "WARN: Auto-download failed — install manually from https://kenney.nl/assets/interface-sounds into:"
    echo "  $AUDIO_DIR"
  fi
fi

if $INSTALL_CITY; then
  mkdir -p "$CITY_DIR"
  echo "Cloning Kenney City Kit (Commercial) sample…"
  if git clone --depth 1 --filter=blob:none --sparse https://github.com/KenneyNL/City-Kit-Commercial.git "$tmpdir/city" 2>/dev/null; then
    git -C "$tmpdir/city" sparse-checkout set Models/GLB 2>/dev/null || true
    if [ -d "$tmpdir/city/Models/GLB" ]; then
      find "$tmpdir/city/Models/GLB" -name '*.glb' | head -24 | while read -r f; do
        cp -n "$f" "$CITY_DIR/"
      done
      python3 - <<PY
import glob, json, os
city = "$CITY_DIR"
files = sorted(os.path.basename(p) for p in glob.glob(os.path.join(city, "*.glb")))
with open(os.path.join(city, "index.json"), "w", encoding="utf-8") as f:
    json.dump({"files": files}, f)
PY
      echo "Installed GLBs + index.json → $CITY_DIR"
    else
      echo "WARN: GLB folder not found — download from https://kenney.nl/assets/city-kit-commercial"
    fi
  else
    echo "WARN: City kit clone failed — use Poly Pizza / manual Kenney zip"
  fi
fi

echo "Done. Update CREDITS.md in flight-nemulator/public if you ship these assets."
