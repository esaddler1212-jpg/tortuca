# Open Generative AI (workshop)

[Open Generative AI](https://github.com/Anil-matcha/Open-Generative-AI) is a MIT-licensed creative studio (image, video, lip sync, workflows) that talks to [MuAPI](https://muapi.ai) with **your** API key. Tortuca does **not** ship or embed it in the Iris PWA.

## Bootstrap

```bash
npm run open-generative-ai:bootstrap
cd tools/open-generative-ai/upstream
npm run setup
npm run electron:dev   # desktop (local sd.cpp / Wan2GP optional)
# or
npm run dev            # Next.js → http://localhost:3000
```

Refresh upstream: `OPEN_GENERATIVE_AI_PULL=1 npm run open-generative-ai:bootstrap`

## Tortuca use cases

- **Daily spark** — turn today's prompt into reference stills or mood boards (export PNG, keep in Hub memos).
- **City Nights / Battleworld** — concept frames, poster art, short I2V clips for marketing (not runtime assets unless you own the license).
- **Film / Tortuga** — Cinema Studio controls, lip sync for dialogue tests (pair with Audio2Face upstream for UE later).

See [CHERRY_PICK.md](./CHERRY_PICK.md) for guardrails and what **not** to merge into Netlify.
