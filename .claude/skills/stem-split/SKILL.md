---
name: stem-split
description: Split a song into stems (vocals, drums, bass, other, or vocals + instrumental) with Demucs for E's music (2EASY), on a computer or Claude Code session that has room to run it. Use when E says "split this track", "pull the vocals", "make an instrumental", "get me the stems" or "acapella of my song".
---

# Stem splitting with Demucs

Demucs (https://github.com/facebookresearch/demucs, MIT license) is an open
music source separation model. It takes a song and gives back separate tracks:
**vocals, drums, bass, other** (4 stems), or **vocals + no_vocals** (acapella
and instrumental). Useful for 2EASY: instrumentals for performances, acapellas
for remixes, practice tracks, cutting clips for social.

**Check the repo first.** Open the GitHub page before installing. If it says
the project moved or is archived, use the maintained location it points to, and
note the change to E.

## Step 0: Rights and what E wants

Ask E (one short message):
1. Which file(s)? Upload, Google Drive link, or a path on their machine.
2. What they need: **instrumental**, **acapella**, or **all 4 stems**.
3. WAV (best quality) or MP3 (smaller, easier to share)?

Only split **E's own music or tracks E has permission to use** (2EASY
releases, beats E owns or licensed, collaborators who agreed). Don't split
other artists' commercial songs for release or upload; for personal practice,
say the result is for practice only. Never download songs from YouTube or
streaming sites to split them.

## Step 1: Where to run it

| Where | Speed for a 3–4 min song | Notes |
|---|---|---|
| Computer with an NVIDIA GPU | under a minute | Fastest |
| Mac with Apple Silicon (M1+) | ~1–3 min | Use `-d mps` |
| Any recent computer, CPU only | ~3–10 min | Works fine, just slower |
| Chromebook (Linux on, 8 GB+) | ~10+ min | OK for one song at a time |
| Claude Code cloud session | ~5–10 min on CPU | Needs pip access; files come back as downloads |
| The iMac (Catalina) | Not recommended | Old Python/PyTorch support; use another machine |

Needs about **4 GB free disk** (PyTorch + model) and **8 GB RAM** for a full song.

## Step 2: Install

```bash
python3 -m venv ~/demucs-env
source ~/demucs-env/bin/activate
pip install -U pip
pip install -U demucs
# Audio decoding needs ffmpeg:
#   Mac: brew install ffmpeg    Ubuntu/Chromebook Linux: sudo apt install -y ffmpeg
demucs --help   # confirms it installed
```

The first run downloads the model weights (a few hundred MB).

## Step 3: Split

```bash
source ~/demucs-env/bin/activate
cd ~/Music/2easy            # wherever the file is

# Instrumental + acapella (most common ask)
demucs --two-stems=vocals "Song Name.wav"

# All 4 stems
demucs "Song Name.wav"

# Higher quality (slower, ~4x): fine-tuned model
demucs -n htdemucs_ft "Song Name.wav"

# MP3 output instead of WAV
demucs --two-stems=vocals --mp3 --mp3-bitrate 320 "Song Name.wav"

# Apple Silicon GPU
demucs -d mps --two-stems=vocals "Song Name.wav"
```

Output lands in `separated/<model>/<Song Name>/`:
- two-stem: `vocals.wav` (acapella), `no_vocals.wav` (instrumental)
- four-stem: `vocals.wav`, `drums.wav`, `bass.wav`, `other.wav`

If it runs out of memory on a long track, add `--segment 7` (or lower).

## Step 4: Check it and hand it back

- Listen to the first 30 seconds of each stem. Expect some bleed (faint
  vocals in the instrumental on loud choruses): normal for any separation
  model. If it's bad, re-run with `-n htdemucs_ft`.
- Rename clearly: `Song Name (Instrumental).wav`, `Song Name (Acapella).wav`.
- Put them where E wants them: back in the same folder, or E's Google Drive
  2EASY folder. Ask before uploading anywhere else.
- Tell E: which model, how long it took, any bleed you heard.

## Step 5: Optional, in IRIS

- Add a memo in IRIS Hub → Memos: "Stems for <song>: <where they are>".
- If E does this often, suggest a server-plan entry (GPU rented by the hour,
  like ComfyUI in `docs/SERVER_PLAN.md`), not a Netlify function: Netlify can't
  run PyTorch.

## Guardrails

- Only E's music or tracks E has rights to (Step 0).
- Never commit audio files or stems to the IRIS repo; it's public.
- Don't run Demucs from inside this repo's folder; use a separate folder.
