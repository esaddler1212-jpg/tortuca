# Game & media upstream toolchains

Four **local-only** upstream repos Tortuca references for City Nights, Flight Nemulator, Tortuga film, and (eventually) Iris avatar work. Nothing here ships inside the Netlify PWA or PlayCanvas bundles — clone on your Mac / workstation, follow each folder’s [CHERRY_PICK](../tools/ace-step/CHERRY_PICK.md) guide.

| Upstream | Tortuca path | Best for |
|----------|--------------|----------|
| [ACE-Step 1.5](https://github.com/ace-step/ACE-Step-1.5) | [`tools/ace-step/`](../tools/ace-step/) | Custom **night-drive instrumentals** → `drive-world/public/music/` |
| [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) | [`tools/claude-code-game-studios/`](../tools/claude-code-game-studios/) | **Studio skills** (`/smoke-check`, `/perf-profile`, QA evidence) on browser games |
| [UnrealClaude](https://github.com/Natfii/UnrealClaude) | [`tools/unreal-claude/`](../tools/unreal-claude/) | **UE 5.7** + Claude Code + MCP when you leave PlayCanvas for Unreal |
| [NVIDIA Audio2Face-3D SDK](https://github.com/NVIDIA/Audio2Face-3D-SDK) | [`tools/audio2face-3d/`](../tools/audio2face-3d/) | **Lip-sync / emotion** from speech (film, future Iris face — not web yet) |

## Bootstrap (shallow clone, gitignored)

```bash
npm run ace-step:bootstrap
npm run game-studios:bootstrap
npm run unreal-claude:bootstrap
npm run audio2face:bootstrap
```

Refresh: `ACE_STEP_PULL=1 npm run ace-step:bootstrap` (same pattern per tool’s README).

## City Nights quick wins

1. **Music gap** — audit still wants more CC0 atmosphere; [ACE-Step CHERRY_PICK](../tools/ace-step/CHERRY_PICK.md) → export loops you own into `playlist.json`.
2. **Process** — keep Tortuca’s `npm run test:smoke` / `test:os`; use Game Studios **`/smoke-check`** and **`/perf-profile`** in a side clone with `modes.rigor: minimal`.
3. **Unreal / Audio2Face** — only when you start UE or avatar pipelines; browser games stay PlayCanvas.

## IRIS guardrails

Upstream GPU stacks and Unreal MCP **must not** weaken `AGENTS.md` session gates, `safeFact`, or Netlify secrets policy. Generated music: confirm license (ACE-Step MIT + model disclaimer); do not commit HF tokens or TensorRT paths.
