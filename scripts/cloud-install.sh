#!/usr/bin/env bash
# Cursor Cloud Agent / environment install hook.
# Safe to run on every pod start — skips when package.json is missing.
set -euo pipefail

ROOT="${CURSOR_WORKSPACE:-/workspace}"
cd "$ROOT"

echo ">>> [cloud-install] workspace: $ROOT"

if [[ ! -f package.json ]]; then
  echo ">>> [cloud-install] no package.json — skipping npm install"
  echo ">>> [cloud-install] hint: merge the app branch to main or point the environment at a branch with package.json"
  exit 0
fi

if [[ -f package-lock.json ]]; then
  echo ">>> [cloud-install] running npm ci"
  npm ci
else
  echo ">>> [cloud-install] no package-lock.json — running npm install"
  npm install
fi

echo "<<< [cloud-install] complete"
