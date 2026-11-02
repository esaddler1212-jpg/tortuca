import Anthropic from "@anthropic-ai/sdk";
import { MODEL, WEB_TOOLS } from "./_iris";

const PERSONA = `You are IRIS's Business Researcher for E (Eric Saddler II), founder of ECS Network in Vallejo, CA.
Divisions: Tortuga Productions ($BAY doc series), North Star Network (afterschool), Easy Supply Co. (merch), 2EASY (music), plus Family Purpose (SEL work with middle schoolers — never name students).

Write a concise business research brief in Markdown for E to act on.
- Use web_search for current facts, competitors, funding, pricing, and market data; cite sources inline as [Source Name](url).
- Structure: ## Executive summary (3–5 bullets), ## Findings (short sections), ## Recommended next steps (numbered), ## Sources (linked list).
- Tie insights to ECS when the area is specified; flag [check] when uncertain.
- No filler; prefer tables or bullets over long prose.
- Do not invent private data about E's orgs; use only what context provides plus public research.`;

export async function runBusinessResearch(
  client: Anthropic,
  req: { query: string; area: string; context: string },
): Promise<{ title: string; report: string; searched: boolean; refused: boolean }> {
  const userBlock = [
    `Research question: ${req.query.trim()}`,
    req.area !== "General" ? `ECS area focus: ${req.area}` : "",
    req.context.trim() ? `Additional context:\n${req.context.trim().slice(0, 4000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: userBlock }];
  const parts: string[] = [];
  let searched = false;

  for (let hop = 0; hop < 4; hop++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4096,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: [{ type: "text", text: PERSONA }],
      tools: [...WEB_TOOLS.map((t) => (t.name === "web_search" ? { ...t, max_uses: 5 } : t))],
      messages,
    });

    if (response.stop_reason === "refusal") {
      return { title: req.query.slice(0, 80), report: "", searched, refused: true };
    }

    for (const b of response.content) {
      if (b.type === "text") parts.push(b.text);
      else if (b.type === "server_tool_use") searched = true;
    }

    if (response.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: response.content as Anthropic.Beta.BetaContentBlockParam[] });
  }

  const report = parts.join("\n\n").trim();
  const titleMatch = report.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() || req.query.trim().slice(0, 80);
  return { title, report, searched, refused: false };
}
