#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLONE="$ROOT/gods-eye-view"
UPSTREAM="${GODS_EYE_UPSTREAM:-https://github.com/bilawalsidhu/gods-eye-view.git}"

echo "God's Eye bootstrap — target: $CLONE"

if [[ -d "$CLONE/.git" ]]; then
  if [[ "${GODS_EYE_PULL:-}" == "1" ]]; then
    git -C "$CLONE" pull --ff-only
  else
    echo "Clone already exists at $CLONE (set GODS_EYE_PULL=1 to git pull --ff-only)."
  fi
else
  git clone "$UPSTREAM" "$CLONE"
fi

cd "$CLONE"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

if npm run | grep -q '^  doctor'; then
  npm run doctor
else
  echo "No npm run doctor in this revision — skipping."
fi

cat <<EOF

Next steps (iMac → iPhone/iPad on LAN):
  cd "$CLONE"
  npm run dev -- --host 0.0.0.0 --port 4173

Then in IRIS: Vitals → Bay Area Pulse → Link God's Eye globe
Use http://<your-imac-lan-ip>:4173 (not localhost on the phone).

See also: gods-eye/README.md and .claude/skills/gods-eye-view/SKILL.md
EOF
