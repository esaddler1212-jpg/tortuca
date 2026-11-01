#!/bin/bash
# Install OpenJarvis on an Intel Mac running macOS Catalina (10.15).
#
# The official installer can't finish on Catalina: Ollama needs a newer macOS,
# and some current Python packages only ship macOS 12+ builds. This installs a
# pinned OpenJarvis with dependencies that all have Catalina builds, in cloud
# mode (Claude does the thinking; no local model needed). It ends by compiling
# OpenJarvis's Rust extension (one time, ~20-40 min); SKIP_RUST=1 defers that.
#
#   cd ~/tortuca/alfred-jarvis && ./scripts/install-catalina.sh
#
# Safe to re-run. Compatible with Catalina's bash 3.2.
set -euo pipefail

OJ_COMMIT="45504acbb49459993d60e19d5b37c85fbc0c35ed"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
OJ="${OPENJARVIS_HOME:-$HOME/.openjarvis}"
SRC="$OJ/src"
VENV="$OJ/.venv"

say() { printf '\n==> %s\n' "$1"; }

say "uv (Python installer)"
if ! command -v uv >/dev/null 2>&1; then
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi
uv --version

say "OpenJarvis source (pinned ${OJ_COMMIT:0:8})"
mkdir -p "$OJ"
if [ ! -d "$SRC/.git" ]; then
    git clone https://github.com/open-jarvis/OpenJarvis.git "$SRC"
fi
git -C "$SRC" fetch -q origin
git -C "$SRC" checkout -q "$OJ_COMMIT"

say "Python 3.12 environment"
[ -x "$VENV/bin/python" ] || uv venv --python 3.12 "$VENV"

say "Dependencies (prebuilt for Catalina, nothing compiled)"
uv pip install --python "$VENV/bin/python" --only-binary :all: -r "$HERE/requirements-catalina.txt"
uv pip install --python "$VENV/bin/python" --no-deps -e "$SRC"

say "jarvis command"
mkdir -p "$HOME/.local/bin"
ln -sf "$VENV/bin/jarvis" "$HOME/.local/bin/jarvis"
if ! grep -q 'OpenJarvis' "$HOME/.zshrc" 2>/dev/null; then
    printf '\n# OpenJarvis\nexport PATH="$HOME/.local/bin:$PATH"\n' >> "$HOME/.zshrc"
fi
export PATH="$HOME/.local/bin:$PATH"
jarvis --version

say "Native Rust extension (memory, tools, security checks)"
if [ "${SKIP_RUST:-0}" = "1" ]; then
    echo "    skipped (SKIP_RUST=1). Run scripts/build-rust-extension.sh later."
else
    "$HERE/scripts/build-rust-extension.sh" || echo "    Rust build failed; re-run scripts/build-rust-extension.sh and send the error."
fi

say "Done"
echo "Open a new Terminal window (or run: source ~/.zshrc), then continue with README step 3."
