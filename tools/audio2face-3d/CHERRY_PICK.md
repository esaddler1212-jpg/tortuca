# Audio2Face-3D → Tortuca

## Fits

| Use | Notes |
|-----|--------|
| **Pre-rendered Tortuga / $BAY** | Drive Iris or character dialogue audio through A2F offline → Maya/Blender → video |
| **Desktop Iris avatar (future)** | Sidecar process on iMac: TTS wav → blendshape stream → local viewer (not Netlify) |
| **Emotion tags for copy** | Audio2Emotion on mic tests — tune Iris tone in docs only, not automatic PII logging |

## Does not fit (yet)

| Use | Why |
|-----|-----|
| City Nights in-browser | No TensorRT in Safari; bundle size and license |
| Netlify Functions | No GPU, gated model download on server |
| Real-time Iris PWA | Latency + GPU; keep `chunkForSystemVoice` TTS path |

## Compliance

- Accept NVIDIA / HF licenses on **your** account; never commit tokens or downloaded weights.
- Student / parent audio from Family Purpose must **not** be sent to A2F without explicit product approval.

## If you wire lip-sync later

1. Export a **small blendshape set** per character.
2. Drive morph targets in Three.js / PlayCanvas only from **pre-baked** animation clips for web.
3. Keep live A2F on LAN or localhost with the same “trusted client” mindset as UnrealClaude MCP.
