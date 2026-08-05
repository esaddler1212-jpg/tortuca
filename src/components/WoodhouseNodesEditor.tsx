import { Plus, Trash2 } from "lucide-react";
import type { WoodhouseRegistryEntry } from "../types/woodhouse";

interface Props {
  nodes: WoodhouseRegistryEntry[];
  onChange: (nodes: WoodhouseRegistryEntry[]) => void;
}

const NODE_TYPES = ["commerce", "education", "media", "ops", "custom"];

export function WoodhouseNodesEditor({ nodes, onChange }: Props) {
  const update = (index: number, patch: Partial<WoodhouseRegistryEntry>) => {
    const next = nodes.map((n, i) => (i === index ? { ...n, ...patch } : n));
    onChange(next);
  };

  const add = () => {
    onChange([
      ...nodes,
      {
        id: `app-${Date.now()}`,
        displayName: "New app",
        nodeType: "custom",
        baseUrl: "",
      },
    ]);
  };

  const remove = (index: number) => {
    onChange(nodes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-alfred-mist">
        Register each app&apos;s base URL. Alfred polls{" "}
        <code className="text-alfred-cream/90">/api/woodhouse/snapshot</code> on every node. See{" "}
        <code className="text-alfred-cream/90">WOODHOUSE.md</code> in the repo for the contract.
      </p>
      {nodes.map((node, index) => (
        <div key={node.id + index} className="rounded-lg border border-alfred-border p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-alfred-mist">Node {index + 1}</span>
            <button type="button" className="btn-ghost p-1" onClick={() => remove(index)} aria-label="Remove node">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            className="input-field text-sm"
            placeholder="Display name"
            value={node.displayName}
            onChange={(e) => update(index, { displayName: e.target.value })}
          />
          <input
            className="input-field text-sm"
            placeholder="ID (slug)"
            value={node.id}
            onChange={(e) => update(index, { id: e.target.value })}
          />
          <select
            className="input-field text-sm"
            value={node.nodeType}
            onChange={(e) => update(index, { nodeType: e.target.value })}
          >
            {NODE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className="input-field text-sm"
            placeholder="https://your-app.netlify.app"
            value={node.baseUrl}
            onChange={(e) => update(index, { baseUrl: e.target.value.replace(/\/$/, "") })}
          />
        </div>
      ))}
      <button type="button" className="btn-gold w-full" onClick={add}>
        <Plus className="h-4 w-4" /> Add Woodhouse node
      </button>
    </div>
  );
}
