# ACE-Step → City Nights music

**Do not** call ACE-Step from the browser or Netlify — keep inference on your workstation (or a trusted LAN API). Ship only **audio files** you generated and are comfortable licensing for personal play.

## Workflow

1. Bootstrap: `npm run ace-step:bootstrap` and run `uv run acestep` (or API on port 8001).
2. Prompt pattern (instrumental, loop-friendly):
   - *“Instrumental lo-fi electronic, 88–96 BPM, night city drive, no vocals, 2–3 minute loop, warm synth pads, subtle sub-bass”*
   - Add *“SF Bay, fog, neon reflections”* for tone; avoid artist names (ACE-Step disclaimer).
3. Export **WAV** from Gradio, transcode for the web:
   ```bash
   ffmpeg -i track.wav -c:a libvorbis -q:a 6 drive-world/public/music/my-night-loop.ogg
   ```
4. Append to [`drive-world/public/music/playlist.json`](../../drive-world/public/music/playlist.json).
5. In-game: **Settings → Music → Use my playlist** (or leave procedural radio on).

## Model pick (upstream table)

| Your machine | Start here |
|--------------|------------|
| Mac Apple Silicon | `start_gradio_ui_macos.sh` / MPS tier in upstream README |
| NVIDIA 8–12 GB | `acestep-v15-turbo` + small LM |
| NVIDIA 20 GB+ | `acestep-v15-xl-turbo` for higher quality |

## LoRA (optional)

Upstream supports 8-song LoRA for a personal “City Nights station” style — train locally, export stems you own; do not commit `.safetensors` into Tortuca.

## What not to cherry-pick

- Do not add ACE-Step Python deps to repo root `package.json`.
- Do not expose `localhost:8001` to the public internet without auth.
- Iris TTS playlists stay separate (`game-music.ts` procedural + CC0 files only).
