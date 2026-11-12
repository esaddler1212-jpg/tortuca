#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/upstream"
UPSTREAM="${ACE_STEP_UPSTREAM:-https://github.com/ace-step/ACE-Step-1.5.git}"

echo "ACE-Step bootstrap — upstream: $UPSTREAM"
echo "Target clone: $CLONE"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${ACE_STEP_PULL:-}" == "1" ]]; then
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone exists (set ACE_STEP_PULL=1 to pull)."
  fi
else
  git clone --depth 1 "$UPSTREAM" "$CLONE"
fi

echo ""
echo "Cherry-pick: tools/ace-step/CHERRY_PICK.md"
