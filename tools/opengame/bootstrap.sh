#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
UPSTREAM="${OPENGAME_UPSTREAM:-https://github.com/nexu-io/opengame.git}"
TARGET="${ROOT}/upstream"
if [[ -d "${TARGET}/.git" ]]; then
  if [[ "${OPENGAME_PULL:-}" == "1" ]]; then
    git -C "${TARGET}" pull --ff-only
  else
    echo "Clone exists (set OPENGAME_PULL=1 to pull)."
  fi
else
  git clone --depth 1 "${UPSTREAM}" "${TARGET}"
fi
echo "OpenGame upstream: ${TARGET}"
echo "Cherry-pick: tools/opengame/OPENGAME_CHERRY_PICK.md"