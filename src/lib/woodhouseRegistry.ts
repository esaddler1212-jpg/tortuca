import type { WoodhouseRegistryEntry } from "../types/woodhouse";

export const DEFAULT_WOODHOUSE_NODES: WoodhouseRegistryEntry[] = [
  {
    id: "easy-supply-co",
    displayName: "Easy Supply Co.",
    nodeType: "commerce",
    baseUrl: "",
  },
  {
    id: "family-purpose",
    displayName: "Family Purpose",
    nodeType: "education",
    baseUrl: "",
    provider: "family-purpose-backup",
  },
  {
    id: "sure-ledger",
    displayName: "Sure (finance)",
    nodeType: "finance",
    baseUrl: "",
  },
];

export function migrateWoodhouseNodes(settings: {
  woodhouseNodes?: WoodhouseRegistryEntry[];
  woodhouseNodeUrl?: string;
  familyPurposeNodeUrl?: string;
}): WoodhouseRegistryEntry[] {
  if (settings.woodhouseNodes && settings.woodhouseNodes.length > 0) {
    return settings.woodhouseNodes;
  }
  const nodes: WoodhouseRegistryEntry[] = [];
  if (settings.woodhouseNodeUrl?.trim()) {
    nodes.push({
      id: "easy-supply-co",
      displayName: "Easy Supply Co.",
      nodeType: "commerce",
      baseUrl: settings.woodhouseNodeUrl.trim().replace(/\/$/, ""),
    });
  }
  if (settings.familyPurposeNodeUrl?.trim()) {
    nodes.push({
      id: "family-purpose",
      displayName: "Family Purpose",
      nodeType: "education",
      baseUrl: settings.familyPurposeNodeUrl.trim().replace(/\/$/, ""),
    });
  }
  return nodes;
}
