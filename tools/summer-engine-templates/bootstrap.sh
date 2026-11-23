#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UP="$ROOT/upstream"
CATALOG="$ROOT/catalog.json"

mkdir -p "$UP"

clone_or_pull() {
  local id="$1" url="$2" branch="${3:-main}"
  local dest="$UP/$id"
  if [[ -d "$dest/.git" ]]; then
    if [[ "${SUMMER_ENGINE_PULL:-}" == "1" ]]; then
      git -C "$dest" fetch origin "$branch" --depth 1
      git -C "$dest" checkout "$branch" 2>/dev/null || true
      git -C "$dest" reset --hard "origin/$branch" 2>/dev/null || git -C "$dest" pull --ff-only
    else
      echo "  exists: $id (set SUMMER_ENGINE_PULL=1 to refresh)"
    fi
  else
    echo "  clone: $id ($branch)"
    git clone --depth 1 --branch "$branch" "$url" "$dest"
  fi
}

echo "Summer Engine templates — shallow clones under $UP"
echo "Cherry-pick guide: tools/summer-engine-templates/CHERRY_PICK.md"
echo ""

clone_or_pull "procedural-road-world" "https://github.com/SummerEngine/template-3d-procedural-road-world.git" "codex/importable-template"
clone_or_pull "racing-game" "https://github.com/SummerEngine/template-3d-racing-game.git" "main"
clone_or_pull "open-world-explore-tps" "https://github.com/SummerEngine/template-3d-open-world-explore-tps.git" "main"
clone_or_pull "sakura-rally" "https://github.com/SummerEngine/sakura-rally.git" "main"

echo ""
echo "✓ Ready. Open any folder in Summer Engine or Godot 4.7 for reference runs."