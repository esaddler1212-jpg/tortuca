#!/usr/bin/env bash
set -euo pipefail

# Shallow clone of MAL19INDUSTRIES/JARVIS-OS-V.2 for local experimentation.
# Does not merge into Iris — see jarvis-os-v2/CHERRY_PICK.md.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/JARVIS-OS-V.2"
UPSTREAM="${JARVIS_OS_UPSTREAM:-https://github.com/MAL19INDUSTRIES/JARVIS-OS-V.2.git}"

echo "JARVIS-OS-V.2 bootstrap — upstream: $UPSTREAM"
echo "Target clone: $CLONE"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${JARVIS_OS_PULL:-}" == "1" ]]; then
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone already exists at $CLONE (set JARVIS_OS_PULL=1 to git pull --ff-only)."
  fi
else
  git clone --depth 1 "$UPSTREAM" "$CLONE"
fi

echo ""
echo "Cherry-pick guide: jarvis-os-v2/CHERRY_PICK.md"
echo "Setup (once, in the clone):"
echo "  cd \"$CLONE\" && python scripts/setup_jarvis.py"
echo "  # Add GEMINI_API_KEY to \"$CLONE/.env\", then: jarvis"
echo "Self-test (after setup):  npm run jarvis-os-v2:self-test"
