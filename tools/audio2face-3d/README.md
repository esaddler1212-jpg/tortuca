# NVIDIA Audio2Face-3D SDK

Upstream **[NVIDIA/Audio2Face-3D-SDK](https://github.com/NVIDIA/Audio2Face-3D-SDK)** — **Audio2Face** + **Audio2Emotion** inference (speech → blendshapes / emotion). C++/CUDA/TensorRT; gated Hugging Face models.

Not used in City Nights or the Iris PWA today. Relevant for **Tortuga / ECS digital avatars** and a possible future **talking Iris face** on desktop or pre-rendered video.

## Reference clone

```bash
npm run audio2face:bootstrap
```

Path: `tools/audio2face-3d/upstream/` (**gitignored**).

## Build (workstation only)

Requires **NVIDIA GPU**, CUDA 12.8+, TensorRT 10.13+, Python 3.8–3.10 for model scripts, `git lfs`, and HF login for gated Audio2Emotion models. See upstream README (`fetch_deps`, `build.sh`, `download_models.sh`).

Visualization: [Maya-ACE](https://github.com/NVIDIA/Maya-ACE) or export `.bin` for DCC tools.

## Tortuca use

[CHERRY_PICK.md](./CHERRY_PICK.md) — integration boundaries vs browser WebGL.
