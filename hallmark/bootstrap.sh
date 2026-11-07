#!/usr/bin/env bash
set -euo pipefail

# Shallow clone of Hallmark for local reference (themes, scripts). The skill is
# normally installed with `npx skills add nutlope/hallmark` — see hallmark/README.md.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/hallmark"
UPSTREAM="${HALLMARK_UPSTREAM:-https://github.com/Nutlope/hallmark.git}"

echo "Hallmark bootstrap — upstream: $UPSTREAM"
echo "Target clone: $CLONE"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${HALLMARK_PULL:-}" == "1" ]]; then
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone already exists at $CLONE (set HALLMARK_PULL=1 to git pull --ff-only)."
  fi
else
  git clone --depth 1 "$UPSTREAM" "$CLONE"
fi

echo ""
echo "Install the skill for Cursor (recommended — from any directory):"
echo "  npx skills add nutlope/hallmark -g --agent cursor"
echo "Or from this clone:  node \"$CLONE/skills/hallmark/scripts/install.mjs\""
echo "Full guide: https://github.com/Nutlope/hallmark#install"
