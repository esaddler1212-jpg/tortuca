#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/herald-upstream"
UPSTREAM="${HERALD_OS_UPSTREAM:-https://github.com/iamlukethedev/Herald-OS.git}"

echo "Herald OS bootstrap — upstream: $UPSTREAM"
echo "Target clone: $CLONE"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${HERALD_OS_PULL:-}" == "1" ]]; then
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone already exists at $CLONE (set HERALD_OS_PULL=1 to git pull --ff-only)."
  fi
else
  git clone --depth 1 "$UPSTREAM" "$CLONE"
fi

echo ""
echo "Cherry-pick guide: herald-os/CHERRY_PICK.md"
