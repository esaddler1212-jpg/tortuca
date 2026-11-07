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

# IRIS embed: John's lantern oath + TTS (no mismatched futurist WAV).
python3 - "$HTML" <<'PY'
import re, sys
path = sys.argv[1]
text = open(path, encoding="utf-8").read()

oath_html = (
    '<div id="oath" aria-live="polite" aria-label="Lantern oath">'
    "<span>In brightest day,</span>"
    "<span>in darkest night,</span>"
    "<span>I'll embrace my fear,</span>"
    "<span>I'll do what's right.</span>"
    "<span>I choose this ring,</span>"
    "<span>I choose this fight,</span>"
    "<span>In service to this</span>"
    '<span class="final"><b>lantern\'s light.</b></span>'
    "</div>"
)
text = re.sub(r'<div id="oath"[^>]*>.*?</div>', oath_html, text, count=1, flags=re.S)
text = text.replace("The Futurist Oath", "Lantern's Oath", 2)
text = text.replace("<title>The Futurist Oath</title>", "<title>Lantern's Oath — IRIS</title>")

iris_hook = """if(new URLSearchParams(location.search).get('irisEmbed')==='1'){window.__IRIS_EMBED_OATH=1;
  const irisLines=["In brightest day,","in darkest night,","I'll embrace my fear,","I'll do what's right.",
    "I choose this ring,","I choose this fight,","In service to this","lantern's light."];
  if(LANTERNS.futurist){LANTERNS.futurist.lines=irisLines;LANTERNS.futurist.title="Lantern's Oath";
    LANTERNS.futurist.len=[2.05,1.82,2.5,1.8,2.1,2.0,2.02,3.7];}
}"""

if "__IRIS_EMBED_OATH" not in text:
    text = text.replace(
        "let LT=(",
        iris_hook + "\nlet LT=(",
        1,
    )

if "window.__IRIS_EMBED_OATH" not in text or "function say(i,text,done,waited){" in text:
    text = text.replace(
        "function say(i,text,done,waited){hookAudio();",
        "function say(i,text,done,waited){if(window.__IRIS_EMBED_OATH){speak2(text,done);return;}hookAudio();",
        1,
    )

open(path, "w", encoding="utf-8").write(text)
PY

echo "Futurist Lantern installed to $DEST ($(du -sh "$DEST" | cut -f1))."
