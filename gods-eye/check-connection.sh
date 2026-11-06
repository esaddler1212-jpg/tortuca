#!/usr/bin/env bash
#
# God's Eye connection check — reachability, HTTP status, simple latency.
# Run on the iMac (or any machine that can reach the globe URL).
#
# Usage:
#   ./check-connection.sh
#   ./check-connection.sh http://192.168.1.42:4173
#   GODS_EYE_URL=https://globe.example.com ./check-connection.sh
#
set -euo pipefail

URL="${1:-${GODS_EYE_URL:-http://127.0.0.1:4173}}"

PORT=4173
if [[ "$URL" =~ :([0-9]+)(/|$|\?) ]]; then
  PORT="${BASH_REMATCH[1]}"
fi

bold() { printf '\033[1m%s\033[0m\n' "$*"; }

echo
bold "God's Eye connection check"
echo "Target: $URL"
echo

if command -v lsof >/dev/null 2>&1; then
  if lsof -iTCP:"$PORT" -sTCP:LISTEN -n -P 2>/dev/null | grep -q .; then
    echo "✓ Listener on TCP $PORT (local)"
  else
    echo "⚠ No local listener on TCP $PORT — if this URL points elsewhere, that's expected"
  fi
  echo
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Install curl to measure HTTP latency."
  exit 1
fi

set +e
code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 12 "$URL" 2>/dev/null)
curl_exit=$?
total=$(curl -sS -o /dev/null -w "%{time_total}" --max-time 12 "$URL" 2>/dev/null)
set -e

if [[ "$curl_exit" -ne 0 ]] || [[ -z "$code" ]]; then
  bold "Reachability: failed"
  curl -sSI --max-time 12 "$URL" 2>&1 | head -5 || true
  echo
  echo "Suggestions:"
  echo "  • Start God’s Eye:  cd gods-eye/gods-eye-view && npm run dev -- --host 0.0.0.0 --port 4173"
  echo "  • From phone: IRIS URL must be iMac LAN IP or Tailscale IP, not localhost."
  echo "  • macOS Firewall: allow Node inbound on port $PORT."
  echo "  • Tailscale: both devices same tailnet; run: tailscale ip -4  on the server"
  exit 1
fi

echo "HTTP status: $code"
echo "Time to complete request: ${total}s"
echo

bold "Readout"
case "${code:0:1}" in
  2) echo "✓ OK ($code)" ;;
  3) echo "⚠ Redirect ($code) — IRIS may need the final URL after redirects" ;;
  4) echo "⚠ Client error ($code)" ;;
  5) echo "⚠ Server error ($code)" ;;
  *) echo "? Status $code" ;;
esac

slow=""
if [[ "$total" =~ ^[0-9.]+$ ]] && command -v awk >/dev/null 2>&1; then
  if awk -v t="$total" 'BEGIN { exit !(t + 0 > 2.0) }'; then
    slow=1
  fi
fi

echo
if [[ -n "$slow" ]]; then
  bold "Latency: high"
  echo "Total ${total}s — check Wi‑Fi, or Tailscale relay vs direct (tailscale status on Mac)."
  echo "Try turning off heavy map layers in God’s Eye while testing."
else
  bold "Latency: OK"
  echo "If the globe still stutters, it's often GPU/WebGL on the device, not round-trip time."
fi

echo
if [[ "$URL" == http://* ]] || [[ "$URL" == HTTP://* ]]; then
  echo "Mixed content: IRIS is HTTPS. If the link won't open from IRIS, use HTTPS (Tailscale Serve, Caddy, or deploy)."
fi

echo
echo "Re-run:  gods-eye/check-connection.sh \"$URL\""
echo
