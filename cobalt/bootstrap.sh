#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/cobalt-upstream"
UPSTREAM="${COBALT_UPSTREAM:-https://github.com/imputnet/cobalt.git}"

echo "cobalt bootstrap — upstream: $UPSTREAM"
echo "Target clone: $CLONE"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${COBALT_PULL:-}" == "1" ]]; then
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone already exists (set COBALT_PULL=1 to pull)."
  fi
else
  git clone --depth 1 "$UPSTREAM" "$CLONE"
fi

echo ""
echo "Cherry-pick guide: cobalt/CHERRY_PICK.md"
