import type { BusinessResearchRequest, BusinessResearchResult } from "../../shared/businessResearch";
import { authHeaders } from "./google";

export async function runBusinessResearch(
  req: BusinessResearchRequest & { timeZone?: string },
): Promise<BusinessResearchResult> {
  const res = await fetch("/api/business-research", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(req),
  });
  const data = (await res.json()) as BusinessResearchResult & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Research failed");
  if (data.error) throw new Error(data.error);
  return data;
}
