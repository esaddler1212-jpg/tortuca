#!/usr/bin/env bash
# Shallow-clone PlayCanvas org repos into a local mirror directory.
#
# Usage:
#   ./scripts/clone-playcanvas-org.sh [tier] [dest]
#
# Tiers (see docs/PLAYCANVAS_INBROWSER_GAME.md):
#   core     — minimum stack for a browser game (engine, scaffold, examples, skills)
#   game     — core + gameplay libs, sample game, agent tooling
#   all      — every repo in docs/playcanvas-org-repos.json (82 as of 2026-11)
#
# Default dest: ../playcanvas-org-mirror (sibling of tortuca checkout)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/docs/playcanvas-org-repos.json"
TIER="${1:-core}"
DEST="${2:-$(dirname "$ROOT")/playcanvas-org-mirror}"

if [[ ! -f "$MANIFEST" ]]; then
  echo "Missing $MANIFEST — run: ./scripts/fetch-playcanvas-org-repos.sh" >&2
  exit 1
fi

CORE_REPOS=(
  engine
  create-playcanvas
  playcanvas.github.io
  skills
  react
  web-components
)

GAME_EXTRA=(
  awesome-playcanvas
  FlappyBird
  playcanvas-tween
  playcanvas-p2.js
  playcanvas-spine
  playcanvas-webpack
  playcanvas-editor-ts-template
  playcanvas-sync
  playcanvas-rest-api-tools
  developer-site
  prompts
  stage
  editor-mcp-server
  vscode-extension
  inspector
  model-viewer
)

pick_names() {
  case "$TIER" in
    core) printf '%s\n' "${CORE_REPOS[@]}" ;;
    game) printf '%s\n' "${CORE_REPOS[@]}" "${GAME_EXTRA[@]}" ;;
    all) jq -r '.repos[].name' "$MANIFEST" ;;
    *)
      echo "Unknown tier: $TIER (core | game | all)" >&2
      exit 1
      ;;
  esac
}

mkdir -p "$DEST"
echo "Mirror: $DEST (tier=$TIER)"

while IFS= read -r name; do
  [[ -z "$name" ]] && continue
  url="$(jq -r --arg n "$name" '.repos[] | select(.name==$n) | .clone_url' "$MANIFEST")"
  if [[ -z "$url" || "$url" == "null" ]]; then
    echo "skip (not in manifest): $name" >&2
    continue
  fi
  target="$DEST/$name"
  if [[ -d "$target/.git" ]]; then
    echo "exists: $name"
    continue
  fi
  echo "clone: $name"
  git clone --depth 1 "$url" "$target"
done < <(pick_names | sort -u)

echo "Done."
