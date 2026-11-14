# Creative workshops

Local and hosted tools for **daily sparks**, Tortuga film, and PlayCanvas games. Catalog: [`workshops/tortuca-creative.json`](../workshops/tortuca-creative.json). In Alfred: **Plan → Workshops**.

Nothing in this list ships inside the Netlify PWA bundle. Game **runtime** toolchains (ACE-Step, Unreal, Audio2Face) stay in [`UPSTREAM_GAME_TOOLCHAIN.md`](./UPSTREAM_GAME_TOOLCHAIN.md).

## Open Generative AI (featured)

| | |
|---|---|
| Upstream | [Anil-matcha/Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI) |
| Tortuca path | [`tools/open-generative-ai/`](../tools/open-generative-ai/) |
| Bootstrap | `npm run open-generative-ai:bootstrap` |
| Hosted try | [muapi.ai/open-generative-ai](https://muapi.ai/open-generative-ai) |

MIT studio for image, video, lip sync, cinema, and workflow pipelines. Uses MuAPI with **bring-your-own-key**; desktop adds optional **sd.cpp** (SD 1.5 / SDXL / Z-Image) and **Wan2GP** (video on NVIDIA/AMD or remote MCP).

Cherry-pick rules: [`tools/open-generative-ai/CHERRY_PICK.md`](../tools/open-generative-ai/CHERRY_PICK.md).

## Other catalog entries

| Workshop | Doc |
|----------|-----|
| Blockbench | [`BLOCKBENCH_WORKFLOW.md`](./BLOCKBENCH_WORKFLOW.md) |
| World Gacha | [`WORLDGACHA_WORKFLOW.md`](./WORLDGACHA_WORKFLOW.md) |
| Kenney CC0 | [`GAMEDEV_RESOURCES.md`](./GAMEDEV_RESOURCES.md) |

## IRIS guardrails

Workshops are **outside** Iris server tools. Do not weaken `safeFact`, session gates, or Family Purpose privacy when documenting outputs. API keys for MuAPI or Hugging Face stay on the workstation only.
