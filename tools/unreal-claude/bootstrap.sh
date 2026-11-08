#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/upstream"
UPSTREAM="${UNREAL_CLAUDE_UPSTREAM:-https://github.com/Natfii/UnrealClaude.git}"

echo "UnrealClaude bootstrap — upstream: $UPSTREAM"
echo "Target clone: $CLONE (shallow; use full clone + submodules on UE machine)"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${UNREAL_CLAUDE_PULL:-}" == "1" ]]; then
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone exists (set UNREAL_CLAUDE_PULL=1 to pull)."
  fi
else
  git clone --depth 1 "$UPSTREAM" "$CLONE"
fi

echo ""
echo "Build plugin on your UE 5.7 machine per upstream README (--recurse-submodules)."
echo "Cherry-pick: tools/unreal-claude/CHERRY_PICK.md"
