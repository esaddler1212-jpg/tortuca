#!/usr/bin/env bash
# Pin-aligned with https://github.com/storytold/craft-anything/releases
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
VERSION="$(tr -d '[:space:]' < "$ROOT/VERSION")"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) TA="x86_64" ;;
  aarch64|arm64) TA="aarch64" ;;
  *)
    echo "Unsupported CPU: $ARCH (build from source: cargo install --path apps/craft-anything-cli)" >&2
    exit 1
    ;;
esac
ASSET="craft-anything-${VERSION}-linux-${TA}.tar.gz"
URL="https://github.com/storytold/craft-anything/releases/download/v${VERSION}/${ASSET}"
BIN_DIR="$ROOT/bin"
CLI="$BIN_DIR/craft-anything-cli"
mkdir -p "$BIN_DIR"
if [[ -x "$CLI" ]]; then
  echo "craft-anything-cli already installed: $("$CLI" --version)"
else
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  echo "Downloading $URL ..."
  curl -fL "$URL" -o "$TMP/$ASSET"
  tar -xzf "$TMP/$ASSET" -C "$TMP"
  cp "$TMP/craft-anything-${VERSION}-linux-${TA}/bin/craft-anything-cli" "$CLI"
  chmod +x "$CLI"
  echo "Installed $("$CLI" --version) -> $CLI"
fi
if [[ "${1:-}" == "--cursor" ]]; then
  REPO_ROOT="$(cd "$ROOT/../.." && pwd)"
  PROJECT="${CRAFT_PROJECT:-$REPO_ROOT/drive-world/research/city-nights-browser}"
  "$CLI" setup --client cursor --yes --project "$PROJECT"
  echo "Restart Cursor to load the craft-anything MCP server."
fi
if [[ "${1:-}" == "--doctor" ]] || [[ "${2:-}" == "--doctor" ]]; then
  "$CLI" doctor
fi
