import type { BusinessResearchRequest, BusinessResearchResult } from "../../shared/businessResearch";
import { authHeaders } from "./google";

function parseJsonBody(text: string): (BusinessResearchResult & { error?: string }) | null {
  try {
    return JSON.parse(text) as BusinessResearchResult & { error?: string };
  } catch {
    return null;
  }
}

export async function runBusinessResearch(
  req: BusinessResearchRequest & { timeZone?: string },
): Promise<BusinessResearchResult> {
  let res: Response;
  try {
    res = await fetch("/api/business-research", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(req),
    });
  } catch {
    throw new Error("Can't reach IRIS functions. Open the Netlify site (alfred2) or run netlify dev — not plain Vite alone.");
  }

  const raw = await res.text();
  const data = parseJsonBody(raw);
  if (!data) {
    throw new Error(
      res.ok
        ? "Research returned an invalid response."
        : `Research failed (${res.status}). ${raw.slice(0, 120) || "Try again in a minute."}`,
    );
  }
  if (!res.ok) throw new Error(data.error ?? "Research failed");
  if (data.error) throw new Error(data.error);
  if (!data.report?.trim()) throw new Error("Research finished but returned no report. Try a narrower question.");
  return data;
}
