#!/usr/bin/env bash
set -euo pipefail

# Shallow clone of REA (Reverse Engineer Anything) for local reference / Cursor MCP setup.
# IRIS never bundles this — see rea/README.md.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/rea"
UPSTREAM="${REA_UPSTREAM:-https://github.com/morluto/rea.git}"

echo "REA bootstrap — upstream: $UPSTREAM"
echo "Target clone: $CLONE"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${REA_PULL:-}" == "1" ]]; then
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone already exists at $CLONE (set REA_PULL=1 to git pull --ff-only)."
  fi
else
  git clone --depth 1 "$UPSTREAM" "$CLONE"
fi

echo ""
echo "Next (on your Mac — not in Tortuca commits):"
echo "  npx rea-agents setup"
echo "Official docs: https://rea.tools/"
echo "Full guide: rea/README.md"
