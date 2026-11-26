/** Stash a Scout preset before opening the Research module. */

import type { ResearchArea, ResearchTemplate } from "../../shared/businessResearch";

const KEY = "iris-research-prefill";

export function stashResearchPrefill(p: {
  label: string;
  area: ResearchArea;
  query: string;
  template?: ResearchTemplate;
}): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* */
  }
}

export function consumeResearchPrefill():
  | { label: string; area: ResearchArea; query: string; template?: ResearchTemplate }
  | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as { label: string; area: ResearchArea; query: string; template?: ResearchTemplate };
  } catch {
    return null;
  }
}