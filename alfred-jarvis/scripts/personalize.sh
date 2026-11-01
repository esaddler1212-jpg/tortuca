#!/bin/bash
# Personalize OpenJarvis as "Alfred" for E. Run AFTER OpenJarvis is installed.
#
#   cd tortuca/alfred-jarvis && ./scripts/personalize.sh
#
# Safe to re-run: it backs up your existing config and leaves MEMORY.md
# (which Alfred appends to) alone if it already exists.
# Compatible with macOS Catalina's bash 3.2.
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
OJ="${OPENJARVIS_HOME:-$HOME/.openjarvis}"
PERSONA_DIR="$OJ/personas/alfred"
STAMP="$(date +%Y%m%d-%H%M%S)"

say() { printf '\n==> %s\n' "$1"; }

if ! command -v jarvis >/dev/null 2>&1; then
    export PATH="$HOME/.local/bin:$PATH"
fi
if ! command -v jarvis >/dev/null 2>&1; then
    echo "jarvis not found. Install OpenJarvis first (see alfred-jarvis/README.md, step 2)." >&2
    exit 1
fi

say "Config"
mkdir -p "$OJ"
if [ -f "$OJ/config.toml" ]; then
    cp "$OJ/config.toml" "$OJ/config.toml.bak-$STAMP"
    echo "    backed up existing config to config.toml.bak-$STAMP"
fi
cp "$HERE/config.toml" "$OJ/config.toml"

say "Alfred persona"
mkdir -p "$PERSONA_DIR" "$OJ/prompts/personas"
cp "$HERE/personas/alfred/SOUL.md" "$PERSONA_DIR/SOUL.md"
cp "$HERE/personas/alfred/USER.md" "$PERSONA_DIR/USER.md"
if [ -f "$PERSONA_DIR/USER.local.md" ]; then
    printf '\n' >> "$PERSONA_DIR/USER.md"
    cat "$PERSONA_DIR/USER.local.md" >> "$PERSONA_DIR/USER.md"
    echo "    merged private USER.local.md"
else
    cat > "$PERSONA_DIR/USER.local.md" <<'EOF'
## Private details (stays on this iMac, never committed)

- Minimum salary for job leads: $
- Max commute: 35 minutes from Vallejo
- Anything else Alfred should know:
EOF
    echo "    created $PERSONA_DIR/USER.local.md. Fill it in, then re-run this script."
fi
if [ ! -f "$PERSONA_DIR/MEMORY.md" ]; then
    cp "$HERE/personas/alfred/MEMORY.md" "$PERSONA_DIR/MEMORY.md"
else
    echo "    kept existing MEMORY.md (Alfred's notes)"
fi
cp "$HERE/prompts/personas/alfred.md" "$OJ/prompts/personas/alfred.md"

say "Python environment"
# Find the virtualenv that runs jarvis: the official installer uses
# ~/.openjarvis/.venv, the manual install uses ~/.openjarvis/src/.venv.
PY=""
for cand in "$OJ/.venv/bin/python" "$OJ/src/.venv/bin/python"; do
    if [ -x "$cand" ] && "$cand" -c "import openjarvis" >/dev/null 2>&1; then
        PY="$cand"; break
    fi
done
if [ -z "$PY" ]; then
    echo "    couldn't find OpenJarvis's Python; Fish voice and Woodhouse sync will use /usr/bin/python3"
    PY="/usr/bin/python3"
else
    echo "    using $PY"
fi

say "Voice plugins (free macOS voice + optional Fish Audio)"
if [ "$PY" != "/usr/bin/python3" ]; then
    SITE="$("$PY" -c 'import sysconfig; print(sysconfig.get_paths()["purelib"])')"
    cp "$HERE/plugins/alfred_macsay_tts.py" "$HERE/plugins/alfred_fish_tts.py" "$SITE/"
    # One startup hook loads both; named zzz_ so it runs after OpenJarvis's own .pth.
    rm -f "$SITE/zzz_alfred_fish_tts.pth"
    printf 'import alfred_macsay_tts\nimport alfred_fish_tts\n' > "$SITE/zzz_alfred_tts.pth"
    "$PY" - <<'PYEOF'
from openjarvis.core.registry import TTSRegistry as R
for key, label in (("macsay", "free macOS voice"), ("fish", "Fish Audio")):
    print(f"    {label}: {'ready' if R.contains(key) else 'NOT installed'}")
PYEOF
else
    echo "    skipped (no OpenJarvis Python found)"
fi

say "Knowledge folders"
mkdir -p "$OJ/knowledge/ecs" "$OJ/knowledge/career"
cp "$HERE/scripts/woodhouse_sync.py" "$OJ/woodhouse_sync.py"
echo "    Put your ECS docs in $OJ/knowledge/ecs and your resume in $OJ/knowledge/career."

say "Woodhouse sync (launchd, daily 6:00 AM + hourly 8 AM-8 PM)"
ALFRED_URL_VALUE="${ALFRED_URL:-https://alfred2.netlify.app}"
echo "    Alfred site: $ALFRED_URL_VALUE (override with ALFRED_URL=...)"
if [ -n "$ALFRED_URL_VALUE" ]; then
    PLIST="$HOME/Library/LaunchAgents/com.ecs.alfred.woodhouse-sync.plist"
    mkdir -p "$HOME/Library/LaunchAgents"
    {
        cat <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>com.ecs.alfred.woodhouse-sync</string>
    <key>ProgramArguments</key>
    <array><string>$PY</string><string>-I</string><string>$OJ/woodhouse_sync.py</string></array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>ALFRED_URL</key><string>$ALFRED_URL_VALUE</string>
        <key>PATH</key><string>$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
    <key>StartCalendarInterval</key>
    <array>
        <dict><key>Hour</key><integer>6</integer><key>Minute</key><integer>0</integer></dict>
EOF
        h=8
        while [ $h -le 20 ]; do
            echo "        <dict><key>Hour</key><integer>$h</integer><key>Minute</key><integer>0</integer></dict>"
            h=$((h + 1))
        done
        cat <<EOF
    </array>
    <key>RunAtLoad</key><true/>
    <key>StandardOutPath</key><string>/tmp/alfred-woodhouse.log</string>
    <key>StandardErrorPath</key><string>/tmp/alfred-woodhouse.log</string>
</dict>
</plist>
EOF
    } > "$PLIST"
    launchctl unload "$PLIST" 2>/dev/null || true
    launchctl load "$PLIST"
    echo "    installed $PLIST"
else
    echo "    skipped (re-run with ALFRED_URL=https://... to enable)"
fi

say "Index knowledge"
jarvis memory index "$OJ/knowledge" || echo "    (index failed; run 'jarvis memory index ~/.openjarvis/knowledge' later)"

say "Scheduled agents (Pacific time)"
"$PY" "$HERE/scripts/create_agents.py" || echo "    (couldn't create agents; run: $PY $HERE/scripts/create_agents.py)"

say "Done"
cat <<EOF
Next:
  1. In ~/.zshrc: export ANTHROPIC_API_KEY=...  (cloud fallback)
                 Voice is free by default (macOS "say", voice Daniel). Optional:
                 export MACSAY_VOICE=...       (any name from: say -v '?')
                 export FISH_API_KEY=...       (premium voice; then set tts_backend = "fish")
  2. jarvis connect gdrive          (one Google sign-in covers Gmail, Calendar, and Tasks)
  3. jarvis doctor                  (check engines and connectors)
  4. jarvis digest --fresh          (hear your first briefing)
  5. jarvis scheduler start         (run the weekly agents)
EOF
