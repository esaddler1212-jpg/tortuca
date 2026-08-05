import type { WoodhouseOrchestrationSnapshot } from "../types/woodhouse";

export function woodhouseBriefingLines(woodhouse?: WoodhouseOrchestrationSnapshot | null): string[] {
  if (!woodhouse?.nodes.length) return [];
  const lines: string[] = [];
  for (const node of woodhouse.nodes) {
    if (node.ok && node.snapshot?.summary) {
      lines.push(`${node.displayName}: ${node.snapshot.summary}.`);
    } else if (!node.ok) {
      lines.push(`${node.displayName} is offline${node.error ? ` (${node.error})` : ""}.`);
    }
  }
  return lines;
}
