#!/usr/bin/env bash
# Install optional CC0 packs for Tortuca PlayCanvas games (not committed to git).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FLIGHT="$ROOT/flight-nemulator/public"
DRIVE="$ROOT/drive-world/public"
AUDIO_DIR="$FLIGHT/audio/kenney"
CITY_DIR="$FLIGHT/models/kenney-city"
DRIVE_CITY_DIR="$DRIVE/models/kenney-city"
MODULAR_DIR="$FLIGHT/models/kenney-modular"
DRIVE_MODULAR_DIR="$DRIVE/models/kenney-modular"
NATURE_DIR="$DRIVE/models/kenney-nature"
PBR_DIR="$DRIVE/textures/ambientcg"

INSTALL_AUDIO=false
INSTALL_CITY=false
INSTALL_CITY_FULL=false
INSTALL_MODULAR=false
INSTALL_NATURE=false
INSTALL_PBR=false
CITY_GLB_LIMIT="${CITY_GLB_LIMIT:-48}"

for arg in "$@"; do
  case "$arg" in
    --audio) INSTALL_AUDIO=true ;;
    --city-glb) INSTALL_CITY=true ;;
    --city-glb-full) INSTALL_CITY=true; INSTALL_CITY_FULL=true; CITY_GLB_LIMIT=999 ;;
    --modular-glb) INSTALL_MODULAR=true ;;
    --nature-glb) INSTALL_NATURE=true ;;
    --pbr-decks) INSTALL_PBR=true ;;
    --all) INSTALL_AUDIO=true; INSTALL_CITY=true; INSTALL_MODULAR=true; INSTALL_PBR=true ;;
    -h|--help)
      echo "Usage: $0 [--audio] [--city-glb|--city-glb-full] [--modular-glb] [--nature-glb] [--pbr-decks] [--all]"
      exit 0
      ;;
  esac
done

if ! $INSTALL_AUDIO && ! $INSTALL_CITY && ! $INSTALL_MODULAR && ! $INSTALL_NATURE && ! $INSTALL_PBR; then
  echo "Pick at least one: --audio --city-glb --modular-glb --nature-glb --pbr-decks"
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
  mkdir -p "$CITY_DIR" "$DRIVE_CITY_DIR"
  echo "Cloning Kenney City Kit (Commercial) sample…"
  if git clone --depth 1 --filter=blob:none --sparse https://github.com/KenneyNL/City-Kit-Commercial.git "$tmpdir/city" 2>/dev/null; then
    git -C "$tmpdir/city" sparse-checkout set Models/GLB 2>/dev/null || true
    if [ -d "$tmpdir/city/Models/GLB" ]; then
      find "$tmpdir/city/Models/GLB" -name '*.glb' | head -"$CITY_GLB_LIMIT" | while read -r f; do
        cp -n "$f" "$CITY_DIR/"
        cp -n "$f" "$DRIVE_CITY_DIR/"
      done
      python3 - <<PY
import glob, json, os
for city in ("$CITY_DIR", "$DRIVE_CITY_DIR"):
    files = sorted(os.path.basename(p) for p in glob.glob(os.path.join(city, "*.glb")))
    with open(os.path.join(city, "index.json"), "w", encoding="utf-8") as f:
        json.dump({"files": files}, f)
PY
      echo "Installed GLBs + index.json → $CITY_DIR and $DRIVE_CITY_DIR"
    else
      echo "WARN: GLB folder not found — download from https://kenney.nl/assets/city-kit-commercial"
    fi
  else
    echo "WARN: City kit clone failed — use Poly Pizza / manual Kenney zip"
  fi
fi

if $INSTALL_MODULAR; then
  mkdir -p "$MODULAR_DIR" "$DRIVE_MODULAR_DIR"
  echo "Fetching Kenney Modular Buildings (CC0)…"
  modular_urls=(
    "https://opengameart.org/sites/default/files/kenney_modular-buildings.zip"
    "https://kenney.nl/media/pages/assets/modular-buildings/kenney_modular-buildings.zip"
  )
  got=false
  for u in "${modular_urls[@]}"; do
    if curl -fsSL -A "Mozilla/5.0 (compatible; TortucaAssetInstaller/1.0)" "$u" -o "$tmpdir/modular.zip"; then
      got=true
      break
    fi
  done
  if $got; then
    unzip -qo "$tmpdir/modular.zip" -d "$tmpdir/mod"
    mapfile -t glbs < <(find "$tmpdir/mod" -name '*.glb' 2>/dev/null | head -48)
    if [ "${#glbs[@]}" -eq 0 ]; then
      mapfile -t glbs < <(find "$tmpdir/mod" -path '*/GLB/*' -name '*.glb' 2>/dev/null | head -48)
    fi
  for f in "${glbs[@]}"; do
      cp -n "$f" "$MODULAR_DIR/"
      cp -n "$f" "$DRIVE_MODULAR_DIR/"
    done
    python3 - <<PY
import glob, json, os
for city in ("$MODULAR_DIR", "$DRIVE_MODULAR_DIR"):
    files = sorted(os.path.basename(p) for p in glob.glob(os.path.join(city, "*.glb")))
    with open(os.path.join(city, "index.json"), "w", encoding="utf-8") as f:
        json.dump({"files": files, "source": "kenney-modular-buildings-cc0"}, f)
PY
    echo "Installed ${#glbs[@]} modular GLBs → $MODULAR_DIR"
  else
    echo "WARN: Modular download failed — https://kenney.nl/assets/modular-buildings or OpenGameArt kenney_modular-buildings.zip"
  fi
fi

if $INSTALL_NATURE; then
  mkdir -p "$NATURE_DIR"
  echo "Cloning Kenney Nature Kit (CC0)…"
  if git clone --depth 1 --filter=blob:none --sparse https://github.com/KenneyNL/Nature-Kit.git "$tmpdir/nature" 2>/dev/null; then
    git -C "$tmpdir/nature" sparse-checkout set Models/GLB 2>/dev/null || true
    if [ -d "$tmpdir/nature/Models/GLB" ]; then
      find "$tmpdir/nature/Models/GLB" -name '*.glb' | head -48 | while read -r f; do
        cp -n "$f" "$NATURE_DIR/"
      done
      python3 - <<PY
import glob, json, os
files = sorted(os.path.basename(p) for p in glob.glob(os.path.join("$NATURE_DIR", "*.glb")))
with open(os.path.join("$NATURE_DIR", "index.json"), "w", encoding="utf-8") as f:
    json.dump({"files": files, "source": "kenney-nature-kit-cc0"}, f)
PY
      echo "Installed nature GLBs + index.json → $NATURE_DIR"
    else
      echo "WARN: Nature GLB folder missing — https://kenney.nl/assets/nature-kit"
    fi
  else
    echo "WARN: Nature kit clone failed — download Kenney Nature Kit manually"
  fi
fi

if $INSTALL_PBR; then
  mkdir -p "$PBR_DIR"
  echo "Fetching AmbientCG Ground085 1K asphalt (CC0)…"
  if curl -fsSL -A "Mozilla/5.0 (compatible; TortucaAssetInstaller/1.0)" \
    "https://ambientcg.com/get?file=Ground085_1K-JPG.zip" -o "$tmpdir/ground.zip"; then
    unzip -qo "$tmpdir/ground.zip" -d "$tmpdir/ground"
    color="$(find "$tmpdir/ground" -iname '*color*.jpg' -type f | head -1)"
    if [ -n "$color" ]; then
      cp -f "$color" "$PBR_DIR/deck-asphalt.jpg"
      echo "Installed deck PBR → $PBR_DIR/deck-asphalt.jpg (City Nights art kits)"
    else
      echo "WARN: Ground085 Color jpg not found in zip"
    fi
  else
    echo "WARN: AmbientCG download failed — manual: https://ambientcg.com/view?id=Ground085"
  fi
fi

echo "Done. Update CREDITS.md in flight-nemulator/public if you ship these assets."
