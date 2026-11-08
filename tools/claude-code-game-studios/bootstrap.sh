#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/upstream"
UPSTREAM="${GAME_STUDIOS_UPSTREAM:-https://github.com/Donchitos/Claude-Code-Game-Studios.git}"

echo "Claude Code Game Studios bootstrap — upstream: $UPSTREAM"
echo "Target clone: $CLONE"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${GAME_STUDIOS_PULL:-}" == "1" ]]; then
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone exists (set GAME_STUDIOS_PULL=1 to pull)."
  fi
else
  git clone --depth 1 "$UPSTREAM" "$CLONE"
fi

echo ""
echo "Cherry-pick: tools/claude-code-game-studios/CHERRY_PICK.md"
