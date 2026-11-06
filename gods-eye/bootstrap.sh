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

LAN_IP=""
if command -v ipconfig >/dev/null 2>&1; then
  LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
  [[ -z "$LAN_IP" ]] && LAN_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi

TS_IP=""
if command -v tailscale >/dev/null 2>&1; then
  TS_IP="$(tailscale ip -4 2>/dev/null | head -1 || true)"
fi

cat <<EOF

Run (reachable on LAN + Tailscale interfaces):
  cd "$CLONE"
  npm run dev -- --host 0.0.0.0 --port 4173

IRIS: Vitals → Bay Area Pulse → Link God's Eye globe

  Same Wi‑Fi (replace with your iMac IP):    http://${LAN_IP:-192.168.x.x}:4173
  Remote (Tailscale, replace with real IP):   http://${TS_IP:-100.x.y.z}:4173

Use tailscale ip -4 on the iMac if the line above is empty. Do not use localhost on the phone.

Full guide: gods-eye/README.md
EOF
