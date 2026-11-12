#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/JARVIS-OS-V.2"

if [[ ! -d "$CLONE/.git" ]]; then
  echo "No clone at $CLONE — run: npm run jarvis-os-v2:bootstrap"
  exit 1
fi

if [[ ! -x "$CLONE/.venv/bin/jarvis" && ! -x "$CLONE/.venv/Scripts/jarvis.exe" ]]; then
  echo "Upstream venv not ready. In the clone:"
  echo "  cd \"$CLONE\" && python scripts/setup_jarvis.py"
  echo "  cp .env.example .env   # set GEMINI_API_KEY"
  exit 1
fi

cd "$CLONE"
# shellcheck disable=SC1091
source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate
jarvis --self-test
