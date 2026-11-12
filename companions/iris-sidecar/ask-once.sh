#!/usr/bin/env bash
set -euo pipefail
MSG="${1:-Hello Iris}"
URL="${IRIS_URL:?set IRIS_URL}"
SESSION="${IRIS_SESSION:?set IRIS_SESSION}"
curl -sS -X POST "$URL/api/ask" \
  -H "Content-Type: application/json" \
  -H "X-Alfred-Session: $SESSION" \
  -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$MSG\"}],\"context\":\"Sidecar smoke test.\",\"timeZone\":\"America/Los_Angeles\"}" | jq -r .reply
