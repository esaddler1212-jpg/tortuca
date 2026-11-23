/**
 * Creative workshops catalog — local toolchains + hosted apps for Plan / Spark.
 * Source of truth: workshops/tortuca-creative.json
 */
import catalog from "../workshops/tortuca-creative.json";

export type WorkshopKind = "hosted" | "local" | "workflow";

export interface WorkshopEntry {
  id: string;
  title: string;
  kind: WorkshopKind;
  url: string;
  /** Optional browser demo when kind is local (e.g. MuAPI hosted build). */
  hostedUrl?: string;
  summary: string;
  bootstrap?: string;
  doc?: string;
  cherryPick?: string;
  tags?: string[];
}

export const WORKSHOP_CATALOG = catalog as { catalogVersion: number; description: string; entries: WorkshopEntry[] };

export const WORKSHOP_ENTRIES: WorkshopEntry[] = WORKSHOP_CATALOG.entries;

export function workshopById(id: string): WorkshopEntry | undefined {
  return WORKSHOP_ENTRIES.find((e) => e.id === id);
}

/** Compact line for Iris when Plan / creative tools come up. */
export function workshopsContextForIris(): string {
  return WORKSHOP_ENTRIES.map((e) => `${e.id}: ${e.title} (${e.kind}) — ${e.summary.slice(0, 90)}`).join("; ");
}
