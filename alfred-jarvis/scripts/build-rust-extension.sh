#!/bin/bash
# Build OpenJarvis's native Rust extension (openjarvis_rust) into Alfred's venv.
#
# OpenJarvis needs it for memory/document indexing, the think/calculator/file
# tools, and its security checks. The official installer builds it in the
# background; install-catalina.sh runs this script at the end.
#
#   ~/tortuca/alfred-jarvis/scripts/build-rust-extension.sh
#
# One-time compile: about 20-40 minutes on a 2012 iMac. Safe to re-run.
# Compatible with Catalina's bash 3.2.
set -euo pipefail

OJ="${OPENJARVIS_HOME:-$HOME/.openjarvis}"
SRC="$OJ/src"
VENV="$OJ/.venv"
PY="$VENV/bin/python"
RUST_DIR="$SRC/rust"
MANIFEST="crates/openjarvis-python/Cargo.toml"

say() { printf '\n==> %s\n' "$1"; }

[ -x "$PY" ] || { echo "OpenJarvis venv not found at $VENV. Run install-catalina.sh first." >&2; exit 1; }
[ -f "$RUST_DIR/$MANIFEST" ] || { echo "Rust sources not found at $RUST_DIR" >&2; exit 1; }

if "$PY" -c "from openjarvis._rust_bridge import RUST_AVAILABLE as R; raise SystemExit(0 if R else 1)" 2>/dev/null; then
    echo "Rust extension already installed. Nothing to do."
    exit 0
fi

say "Rust toolchain"
export PATH="$HOME/.cargo/bin:$PATH"
if ! command -v rustup >/dev/null 2>&1; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain none
    # shellcheck disable=SC1091
    . "$HOME/.cargo/env"
fi
# rust/rust-toolchain.toml pins the version; rustup installs it on first use here.
cd "$RUST_DIR"
rustc --version

say "maturin (Rust → Python build tool)"
uv pip install --python "$PY" --only-binary :all: "maturin>=1.5,<2"

say "Compiling (one time, ~20-40 min on this iMac; it's fine to leave it running)"
export VIRTUAL_ENV="$VENV"
export MACOSX_DEPLOYMENT_TARGET="${MACOSX_DEPLOYMENT_TARGET:-10.15}"
"$VENV/bin/maturin" develop -m "$MANIFEST"

say "Check"
"$PY" -c "from openjarvis._rust_bridge import RUST_AVAILABLE; print('Rust extension available:', RUST_AVAILABLE); raise SystemExit(0 if RUST_AVAILABLE else 1)"
