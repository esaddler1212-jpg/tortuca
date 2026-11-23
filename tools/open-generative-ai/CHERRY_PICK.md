# Open Generative AI → Tortuca workshops

**Do not** embed Open Generative AI in the Alfred PWA, Netlify functions, or Family Purpose. It is a **local or self-hosted workshop** next to ACE-Step and Blockbench.

## Safe workflow

1. Bootstrap: `npm run open-generative-ai:bootstrap`, then `npm run setup` in the clone.
2. Store the MuAPI key **only** in the desktop app or local Next.js `localStorage` — never in Tortuca `.env`, Blobs, or `remember` facts.
3. Prefer the **desktop** build when using local sd.cpp or Wan2GP; keep multi-GB weights on a workstation disk (`OPEN_GENERATIVE_AI_LOCAL_AI_DIR` if needed).
4. Export assets you intend to ship (PNG, WebM) into game or film folders only after you confirm model/API terms.

## What fits Tortuca

| Output | Destination |
|--------|-------------|
| Loop / still for a spark note | Hub memo text + your own file storage |
| Hero concept art | `drive-world/` or `flight-nemulator/` only when license-clear |
| Short promo clip | External drive; link from ECS memos, not committed blobs |

## What not to cherry-pick

- No MuAPI proxy on Netlify (would centralize keys and bypass session guardrails).
- No "uncensored" positioning inside Iris copy or student-facing surfaces.
- Do not add Open Generative AI `packages/studio` to the main `package.json` workspaces without a product decision.
- Iris must not read MuAPI usage or store generation history in `safeFact` — workshops stay outside agent memory unless E explicitly summarizes in a memo.

## Hosted alternative

No install: [muapi.ai/open-generative-ai](https://muapi.ai/open-generative-ai) (same studio, MuAPI account). Still BYOK; not wired into Woodhouse unless you register a custom node later.
