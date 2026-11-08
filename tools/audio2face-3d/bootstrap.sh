#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/upstream"
UPSTREAM="${AUDIO2FACE_UPSTREAM:-https://github.com/NVIDIA/Audio2Face-3D-SDK.git}"

echo "Audio2Face-3D SDK bootstrap — upstream: $UPSTREAM"
echo "Target clone: $CLONE"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${AUDIO2FACE_PULL:-}" == "1" ]]; then
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone exists (set AUDIO2FACE_PULL=1 to pull)."
  fi
else
  git clone --depth 1 "$UPSTREAM" "$CLONE"
fi

echo ""
echo "Run git lfs pull + fetch_deps on a CUDA machine per upstream README."
echo "Cherry-pick: tools/audio2face-3d/CHERRY_PICK.md"
