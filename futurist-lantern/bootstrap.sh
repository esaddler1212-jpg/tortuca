#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/lantern"
TMP="${TMPDIR:-/tmp}/futurist-lantern-clone"
rm -rf "$TMP"
git clone --depth 1 https://github.com/htongyai/futurist-lantern.git "$TMP"
rm -rf "$DEST"
mkdir -p "$DEST"
cp "$TMP/index.html" "$TMP/core-opt2.glb" "$TMP/ring3.glb" "$TMP/LICENSE" "$DEST/"
cp -r "$TMP/voice" "$DEST/"

HTML="$DEST/index.html"

# Parent gets unlock when oath sequence completes (after final line cleanup).
if ! grep -q 'iris:lantern-complete' "$HTML"; then
  sed -i 's/oathT.push(setTimeout(()=>{L.forEach(x=>x.classList.remove/onUnlocked();try{window.parent.postMessage({type:\x27iris:lantern-complete\x27},\x27*\x27);}catch(e){}oat/oathT.push(setTimeout(()=>{L.forEach(x=>x.classList.remove/' "$HTML" || true
fi

# Fallback patch if sed miss: inject after "function boomNow"
if ! grep -q 'iris:lantern-complete' "$HTML"; then
  python3 - "$HTML" <<'PY'
import sys
path = sys.argv[1]
text = open(path, encoding="utf-8").read()
needle = "function boomNow(){boomT=0;"
inject = (
    "function irisLanternDone(){try{if(new URLSearchParams(location.search).get('irisEmbed')!=='1')return;"
    "window.parent.postMessage({type:'iris:lantern-complete'},'*');}catch(e){}}"
)
if "irisLanternDone" not in text:
    text = text.replace(needle, inject + needle, 1)
    text = text.replace("function boomNow(){boomT=0;", "function boomNow(){irisLanternDone();boomT=0;", 1)
open(path, "w", encoding="utf-8").write(text)
PY
fi

# Hide quality button in embed mode
if ! grep -q 'irisEmbed' "$HTML"; then
  python3 - "$HTML" <<'PY'
import sys
path = sys.argv[1]
text = open(path, encoding="utf-8").read()
snip = "document.body.appendChild(r.domElement);"
add = snip + "if(new URLSearchParams(location.search).get('irisEmbed')==='1'){const qb=document.getElementById('qBtn');if(qb)qb.style.display='none';}"
if "irisEmbed')==='1'" not in text and snip in text:
    text = text.replace(snip, add, 1)
open(path, "w", encoding="utf-8").write(text)
PY
fi

echo "Futurist Lantern installed to $DEST ($(du -sh "$DEST" | cut -f1))."
