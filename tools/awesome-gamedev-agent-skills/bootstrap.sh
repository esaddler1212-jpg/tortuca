#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/upstream"
UPSTREAM="${GAMEDEV_SKILLS_UPSTREAM:-https://github.com/gamedev-skills/awesome-gamedev-agent-skills.git}"

echo "awesome-gamedev-agent-skills bootstrap — upstream: $UPSTREAM"
echo "Target clone: $CLONE"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${GAMEDEV_SKILLS_PULL:-}" == "1" ]]; then
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone exists (set GAMEDEV_SKILLS_PULL=1 to pull)."
  fi
else
  git clone --depth 1 "$UPSTREAM" "$CLONE"
fi

echo ""
echo "Cherry-pick: tools/awesome-gamedev-agent-skills/CHERRY_PICK.md"
echo "Install to agent: npx skills add gamedev-skills/awesome-gamedev-agent-skills -a cursor"