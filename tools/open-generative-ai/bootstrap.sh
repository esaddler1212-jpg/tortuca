#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/upstream"
UPSTREAM="${OPEN_GENERATIVE_AI_UPSTREAM:-https://github.com/Anil-matcha/Open-Generative-AI.git}"

echo "Open Generative AI bootstrap — upstream: $UPSTREAM"
echo "Target clone: $CLONE"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${OPEN_GENERATIVE_AI_PULL:-}" == "1" ]]; then
    git -C "$CLONE" submodule update --init --recursive 2>/dev/null || true
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone exists (set OPEN_GENERATIVE_AI_PULL=1 to pull)."
  fi
else
  git clone --recurse-submodules --depth 1 "$UPSTREAM" "$CLONE"
fi

echo ""
echo "Next: cd \"$CLONE\" && npm run setup"
echo "Cherry-pick: tools/open-generative-ai/CHERRY_PICK.md"
