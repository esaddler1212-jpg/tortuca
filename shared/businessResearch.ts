import type { Area } from "./planData";

export type ResearchArea = Area | "General";

export interface BusinessResearchRequest {
  query: string;
  area?: ResearchArea;
  /** Extra context (task deliverable, goal title, etc.) */
  context?: string;
}

export interface BusinessResearchResult {
  title: string;
  report: string;
  searched: boolean;
  memoId: string;
  at: string;
}

/** One-tap starters aligned with ECS divisions. */
export const RESEARCH_PRESETS: { label: string; area: ResearchArea; query: string }[] = [
  {
    label: "$BAY sponsors",
    area: "Tortuga",
    query: "Bay Area doc-series and YouTube sponsor landscape: who funds local creator shows, typical deal sizes, and disclosure norms.",
  },
  {
    label: "Merch DTC comps",
    area: "Easy Supply",
    query: "Independent streetwear / city-edition merch brands: pricing, drops, and Shopify ops at $50–$120 AOV.",
  },
  {
    label: "ASES / afterschool",
    area: "North Star",
    query: "California ASES afterschool funding timeline, Title I priority, and fiscal sponsor vs 501(c)(3) for a new youth program pilot.",
  },
  {
    label: "Sample sale playbook",
    area: "2EASY",
    query: "Independent artist sample sales and listening parties: revenue mix, merch attach, and promotion channels.",
  },
  {
    label: "$100K/mo path",
    area: "ECS",
    query: "Realistic revenue ladder for a multi-division creative founder (film, merch, music, youth program): benchmarks and bottlenecks.",
  },
  {
    label: "Film festival strategy",
    area: "Tortuga",
    query: "Short and episodic doc festival strategy after a YouTube run: Filmhub, Tubi, and regional fests for Bay Area stories.",
  },
];

export function researchMemoTitle(query: string): string {
  const q = query.trim().replace(/\s+/g, " ");
  return q.length <= 72 ? q : `${q.slice(0, 69)}…`;
}
