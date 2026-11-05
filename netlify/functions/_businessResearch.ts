import Anthropic from "@anthropic-ai/sdk";
import { inferResearchTemplate, type ResearchTemplate } from "../../shared/businessResearch";
import { MODEL, WEB_TOOLS } from "./_iris";

const BASE = `You are IRIS's Business Researcher for E (Eric Saddler II), founder of ECS Network in Vallejo, CA.
Divisions: Tortuga Productions ($BAY doc series), North Star Network (afterschool), Easy Supply Co. (merch), 2EASY (music), plus Family Purpose (SEL work with middle schoolers — never name students).

Use web_search for current facts; cite sources inline as [Source Name](url). Flag [check] when uncertain.
Trace repeated stats to a primary source when possible — do not treat ten blogs quoting the same press release as ten independent facts.
Do not invent private data about E's orgs; use only what context provides plus public research.
Prefer tables or bullets; no filler prose.`;

const STRUCTURES: Record<ResearchTemplate, string> = {
  brief: `Write a consultant-grade brief (Markdown) E can read in under 3 minutes:
- Start with # Title
- ## Executive summary — SCQA bullets (situation, complication, answer)
- ## Key findings — 3–5 themes; each with confidence (High/Medium/Low) and **one quantified or comparative data point** when available
- ## Evidence gaps — what you searched for but could not verify
- ## Recommended next steps — numbered; label Critical/High/Medium; tie to ECS area when specified
- ## Sources — linked list`,

  competitive: `Act as a business strategist (agency-agents Business Strategist + competitive-analysis pattern):
- # Title
- ## Executive summary (3 bullets max)
- ## Competitive landscape — up to 5 named competitors/substitutes; table: player | offer | strength | weakness | threat (H/M/L)
- ## Market gaps & opportunities (3 bullets)
- ## Strategic recommendations for ECS — 5 prioritized actions with explicit tradeoffs (what NOT to do)
- ## Threat assessment — one line per competitor
- ## Sources`,

  grant: `Act as a grant prospect researcher (agency-agents Grant Writer — research phase only, not legal advice):
- # Title
- ## Executive summary — funder-fit headline for North Star / youth work when relevant
- ## Alignment assessment — table: opportunity | type | fit (High/Med/Low) | typical award size | deadline rhythm
- ## LOI-ready hook — 2–3 sentences in funder-facing language
- ## Compliance & timeline flags — eligibility, match requirements, reporting burden
- ## Recommended next steps — cultivation before applying
- ## Sources`,

  evidence: `Act as a research synthesist (agency-agents Research Synthesist):
- # Title
- ## Research question & search scope — what you searched and date window
- ## Well-established — claims with multiple independent sources
- ## Contested — both sides with relative strength
- ## Single-source only — not yet replicated; label confidence Low
- ## Evidence gaps — explicit "not found in search"
- ## Recommended next steps for E
- ## Sources — with evidence tier noted (primary vs commentary)`,
};

function buildPersona(template: ResearchTemplate): string {
  return `${BASE}\n\n${STRUCTURES[template]}`;
}

export async function runBusinessResearch(
  client: Anthropic,
  req: { query: string; area: string; context: string; template?: ResearchTemplate },
): Promise<{ title: string; report: string; searched: boolean; refused: boolean; template: ResearchTemplate }> {
  const template = inferResearchTemplate(req.query, req.template);
  const userBlock = [
    `Research question: ${req.query.trim()}`,
    req.area !== "General" ? `ECS area focus: ${req.area}` : "",
    `Brief template: ${template}`,
    req.context.trim() ? `Additional context:\n${req.context.trim().slice(0, 4000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: userBlock }];
  const parts: string[] = [];
  let searched = false;

  for (let hop = 0; hop < 6; hop++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 8192,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system: [{ type: "text", text: buildPersona(template) }],
      tools: [...WEB_TOOLS],
      messages,
    });

    if (response.stop_reason === "refusal") {
      return { title: req.query.slice(0, 80), report: "", searched, refused: true, template };
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
  return { title, report, searched, refused: false, template };
}
