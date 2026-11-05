import type { Area } from "./planData";

export type ResearchArea = Area | "General";

/** Brief shape cherry-picked from agency-agents + 500-AI-Agents report patterns. */
export type ResearchTemplate = "brief" | "competitive" | "grant" | "evidence";

export interface BusinessResearchRequest {
  query: string;
  area?: ResearchArea;
  /** Extra context (task deliverable, goal title, etc.) */
  context?: string;
  template?: ResearchTemplate;
}

export interface BusinessResearchResult {
  title: string;
  report: string;
  searched: boolean;
  memoId: string;
  at: string;
}

export function inferResearchTemplate(query: string, explicit?: ResearchTemplate): ResearchTemplate {
  if (explicit) return explicit;
  const t = query.toLowerCase();
  if (/\b(competitors?|competitive|landscape|porter|moat|positioning|vs\.?)\b/.test(t)) return "competitive";
  if (/\b(grant|funder|loi|rfp|nofo|ases|501\(c\)|fiscal sponsor|prospect research)\b/.test(t)) return "grant";
  if (/\b(systematic|evidence|literature|meta-?analysis|primary source|citation)\b/.test(t)) return "evidence";
  return "brief";
}

/** One-tap starters aligned with ECS divisions. */
export const RESEARCH_PRESETS: {
  label: string;
  area: ResearchArea;
  query: string;
  template?: ResearchTemplate;
}[] = [
  {
    label: "$BAY sponsors",
    area: "Tortuga",
    query:
      "Bay Area doc-series and YouTube sponsor landscape: who funds local creator shows, typical deal sizes, and disclosure norms.",
  },
  {
    label: "Merch DTC comps",
    area: "Easy Supply",
    template: "competitive",
    query:
      "Independent streetwear / city-edition merch brands: pricing, drops, and Shopify ops at $50–$120 AOV.",
  },
  {
    label: "ASES / afterschool",
    area: "North Star",
    template: "grant",
    query:
      "California ASES afterschool funding timeline, Title I priority, and fiscal sponsor vs 501(c)(3) for a new youth program pilot.",
  },
  {
    label: "Sample sale playbook",
    area: "2EASY",
    query:
      "Independent artist sample sales and listening parties: revenue mix, merch attach, and promotion channels.",
  },
  {
    label: "$100K/mo path",
    area: "ECS",
    template: "competitive",
    query:
      "Realistic revenue ladder for a multi-division creative founder (film, merch, music, youth program): benchmarks and bottlenecks.",
  },
  {
    label: "Film festival strategy",
    area: "Tortuga",
    query:
      "Short and episodic doc festival strategy after a YouTube run: Filmhub, Tubi, and regional fests for Bay Area stories.",
  },
  {
    label: "Competitive map",
    area: "ECS",
    template: "competitive",
    query:
      "Map 5 direct competitors or substitutes for ECS Network's combined film + merch + youth program stack — strengths, weaknesses, threat level.",
  },
];

export function researchMemoTitle(query: string): string {
  const q = query.trim().replace(/\s+/g, " ");
  return q.length <= 72 ? q : `${q.slice(0, 69)}…`;
}
