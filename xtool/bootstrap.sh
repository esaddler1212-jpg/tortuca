#!/usr/bin/env bash
set -euo pipefail

# Shallow clone of xtool-org/xtool for local iOS tooling reference.
# Does not merge Swift into Iris — see xtool/CHERRY_PICK.md.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/xtool-upstream"
UPSTREAM="${XTOOL_UPSTREAM:-https://github.com/xtool-org/xtool.git}"

echo "xtool bootstrap — upstream: $UPSTREAM"
echo "Target clone: $CLONE"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${XTOOL_PULL:-}" == "1" ]]; then
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone already exists at $CLONE (set XTOOL_PULL=1 to git pull --ff-only)."
  fi
else
  git clone --depth 1 "$UPSTREAM" "$CLONE"
fi

echo ""
echo "Cherry-pick guide: xtool/CHERRY_PICK.md"
echo "Install CLI (Mac/Linux): https://xtool.sh/documentation/xtooldocs/installation-macos"
echo "On Mac with xtool installed: bash xtool/ios-qa.sh"
