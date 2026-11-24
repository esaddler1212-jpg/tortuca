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
ROADS_DIR="$DRIVE/models/kenney-roads"
SUBURBAN_DIR="$DRIVE/models/kenney-suburban"
PBR_DIR="$DRIVE/textures/ambientcg"

INSTALL_AUDIO=false
INSTALL_CITY=false
INSTALL_CITY_FULL=false
INSTALL_MODULAR=false
INSTALL_NATURE=false
INSTALL_ROADS=false
INSTALL_SUBURBAN=false
INSTALL_PBR=false
INSTALL_BUILDING_PBR=false
INSTALL_CAR_KIT=false
INSTALL_HERO_MINIS=false
CAR_KENNEY_DIR="$DRIVE/models/kenney"
HERO_DIR="$FLIGHT/models/heroes"
CITY_GLB_LIMIT="${CITY_GLB_LIMIT:-48}"

for arg in "$@"; do
  case "$arg" in
    --audio) INSTALL_AUDIO=true ;;
    --city-glb) INSTALL_CITY=true ;;
    --city-glb-full) INSTALL_CITY=true; INSTALL_CITY_FULL=true; CITY_GLB_LIMIT=999 ;;
    --modular-glb) INSTALL_MODULAR=true ;;
    --nature-glb) INSTALL_NATURE=true ;;
    --roads-glb) INSTALL_ROADS=true ;;
    --suburban-glb) INSTALL_SUBURBAN=true ;;
    --pbr-decks) INSTALL_PBR=true ;;
    --building-pbr) INSTALL_BUILDING_PBR=true ;;
    --car-kit-full) INSTALL_CAR_KIT=true ;;
    --hero-minis) INSTALL_HERO_MINIS=true ;;
    --all) INSTALL_AUDIO=true; INSTALL_CITY=true; INSTALL_MODULAR=true; INSTALL_PBR=true ;;
    -h|--help)
      echo "Usage: $0 [--audio] [--city-glb|--city-glb-full] [--modular-glb] [--nature-glb] [--roads-glb] [--suburban-glb] [--pbr-decks] [--building-pbr] [--car-kit-full] [--hero-minis] [--all]"
      exit 0
      ;;
  esac
done

if ! $INSTALL_AUDIO && ! $INSTALL_CITY && ! $INSTALL_MODULAR && ! $INSTALL_NATURE && ! $INSTALL_ROADS && ! $INSTALL_SUBURBAN && ! $INSTALL_PBR && ! $INSTALL_BUILDING_PBR && ! $INSTALL_CAR_KIT && ! $INSTALL_HERO_MINIS; then
  echo "Pick at least one: --audio --city-glb --modular-glb --nature-glb --roads-glb --suburban-glb --pbr-decks --building-pbr --car-kit-full --hero-minis"
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

install_kenney_sparse_glb() {
  local repo_url="$1"
  local sparse_path="$2"
  local dest="$3"
  local source_label="$4"
  mkdir -p "$dest"
  if git clone --depth 1 --filter=blob:none --sparse "$repo_url" "$tmpdir/pack" 2>/dev/null; then
    git -C "$tmpdir/pack" sparse-checkout set "$sparse_path" 2>/dev/null || true
    if [ -d "$tmpdir/pack/$sparse_path" ]; then
      find "$tmpdir/pack/$sparse_path" -name '*.glb' | head -48 | while read -r f; do
        cp -n "$f" "$dest/"
      done
      python3 - <<PY
import glob, json, os
files = sorted(os.path.basename(p) for p in glob.glob(os.path.join("$dest", "*.glb")))
with open(os.path.join("$dest", "index.json"), "w", encoding="utf-8") as f:
    json.dump({"files": files, "source": "$source_label"}, f)
PY
      echo "Installed GLBs → $dest"
    else
      echo "WARN: GLB folder missing for $source_label"
    fi
    rm -rf "$tmpdir/pack"
  else
    echo "WARN: clone failed for $source_label"
  fi
}

if $INSTALL_ROADS; then
  echo "Cloning Kenney Road Pack (CC0)…"
  install_kenney_sparse_glb "https://github.com/KenneyNL/Road-Pack.git" "Models/GLB" "$ROADS_DIR" "kenney-road-pack-cc0"
fi

if $INSTALL_SUBURBAN; then
  echo "Cloning Kenney City Kit Suburban (CC0)…"
  install_kenney_sparse_glb "https://github.com/KenneyNL/City-Kit-Suburban.git" "Models/GLB" "$SUBURBAN_DIR" "kenney-suburban-kit-cc0"
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

if $INSTALL_CAR_KIT; then
  mkdir -p "$CAR_KENNEY_DIR"
  echo "Fetching Kenney Car Kit (CC0) GLBs…"
  if curl -fsSL -A "Mozilla/5.0 (compatible; TortucaAssetInstaller/1.0)" \
    "https://opengameart.org/sites/default/files/kenney_car-kit.zip" -o "$tmpdir/car-kit.zip"; then
    unzip -qo "$tmpdir/car-kit.zip" "Models/GLB format/*.glb" -d "$tmpdir/car-kit"
    find "$tmpdir/car-kit/Models/GLB format" -name '*.glb' -exec cp -n {} "$CAR_KENNEY_DIR/" \;
    echo "Installed car GLBs → $CAR_KENNEY_DIR ($(find "$CAR_KENNEY_DIR" -name '*.glb' | wc -l) files)"
  else
    echo "WARN: Car kit download failed — https://kenney.nl/assets/car-kit"
  fi
fi

if $INSTALL_HERO_MINIS; then
  mkdir -p "$HERO_DIR"
  echo "Installing Kenney Mini Character hero GLBs (CC0)…"
  if curl -fsSL -A "Mozilla/5.0 (compatible; TortucaAssetInstaller/1.0)" \
    "https://opengameart.org/sites/default/files/kenney_mini-characters.zip" -o "$tmpdir/mini.zip"; then
    unzip -qo "$tmpdir/mini.zip" \
      "Models/GLB format/character-male-a.glb" \
      "Models/GLB format/character-male-b.glb" \
      "Models/GLB format/character-male-c.glb" \
      "Models/GLB format/character-male-d.glb" \
      "Models/GLB format/character-male-e.glb" \
      "Models/GLB format/character-female-a.glb" \
      "Models/GLB format/character-female-c.glb" \
      "Models/GLB format/character-female-d.glb" -d "$tmpdir/mini"
    gdir="$tmpdir/mini/Models/GLB format"
    cp -f "$gdir/character-male-b.glb" "$HERO_DIR/emerald-pilot.glb"
    cp -f "$gdir/character-male-c.glb" "$HERO_DIR/storm-hammer.glb"
    cp -f "$gdir/character-female-c.glb" "$HERO_DIR/chrome-sage.glb"
    cp -f "$gdir/character-male-a.glb" "$HERO_DIR/jade-architect.glb"
    cp -f "$gdir/character-male-d.glb" "$HERO_DIR/garnet-brawler.glb"
    cp -f "$gdir/character-female-a.glb" "$HERO_DIR/spectrum-artist.glb"
    cp -f "$gdir/character-female-d.glb" "$HERO_DIR/ki-sage.glb"
    cp -f "$gdir/character-male-e.glb" "$HERO_DIR/time-blade.glb"
    echo "Installed heroes: emerald-pilot, storm-hammer, chrome-sage, jade-architect, garnet-brawler, spectrum-artist, ki-sage, time-blade"
  else
    echo "WARN: Mini characters download failed — OpenGameArt kenney_mini-characters.zip"
  fi
fi

if $INSTALL_BUILDING_PBR; then
  mkdir -p "$PBR_DIR"
  echo "Fetching AmbientCG Concrete047 1K (CC0) for optional facades…"
  if curl -fsSL -A "Mozilla/5.0 (compatible; TortucaAssetInstaller/1.0)" \
    "https://ambientcg.com/get?file=Concrete047_1K-JPG.zip" -o "$tmpdir/concrete.zip"; then
    unzip -qo "$tmpdir/concrete.zip" -d "$tmpdir/concrete"
    color="$(find "$tmpdir/concrete" -iname '*color*.jpg' -type f | head -1)"
    if [ -n "$color" ]; then
      cp -f "$color" "$PBR_DIR/building-facade.jpg"
      echo "Installed building PBR → $PBR_DIR/building-facade.jpg"
    fi
  else
    echo "WARN: Concrete047 download failed — https://ambientcg.com/view?id=Concrete047"
  fi
fi

echo "Done. Update CREDITS.md in flight-nemulator/public if you ship these assets."
