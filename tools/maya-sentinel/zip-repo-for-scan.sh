#!/usr/bin/env bash
# Build a bounded ZIP for MAYA Sentinel from a local clone (no network).
set -euo pipefail
SRC="${1:?usage: zip-repo-for-scan.sh /path/to/cloned-repo}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NAME="$(basename "$SRC")"
OUT="${2:-/tmp/${NAME}-sentinel-scan.zip}"
if [[ ! -d "$SRC" ]]; then
  echo "Not a directory: $SRC" >&2
  exit 1
fi
cd "$SRC"
zip -r -q "$OUT" . \
  -x '*/node_modules/*' \
  -x '*/.git/*' \
  -x '*/dist/*' \
  -x '*/.next/*' \
  -x '*/vendor/bundle/*' \
  -x '*/tmp/*' \
  -x '*/capture/*'
echo "Wrote $OUT ($(du -h "$OUT" | cut -f1))"
echo "Scan: python path/to/MAYA-Sentinel/maya_lens_server.py --scan $OUT --mode ai-surface"