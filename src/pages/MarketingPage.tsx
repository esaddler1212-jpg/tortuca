import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { MarketingIdea } from "../../shared/types";
import { MONTHLY_SALES_GOAL } from "../../shared/types";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";

const categories: MarketingIdea["category"][] = [
  "content",
  "paid",
  "email",
  "partnerships",
  "product",
  "ops",
];

export function MarketingPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["marketing"],
    queryFn: api.getMarketing,
  });

  const save = useMutation({
    mutationFn: api.saveMarketing,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["marketing"] }),
  });

  const [draft, setDraft] = useState("");
  const ideas = data?.ideas ?? [];

  const projectedLift = useMemo(
    () =>
      ideas
        .filter((i) => i.status !== "done")
        .reduce((s, i) => s + (i.estimatedMonthlyLift ?? 0), 0),
    [ideas],
  );

  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: api.getMetrics,
  });

  if (isLoading) return <p className="text-supply-200/60">Loading growth playbook…</p>;

  function updateIdea(id: string, patch: Partial<MarketingIdea>) {
    const next = ideas.map((i) => (i.id === id ? { ...i, ...patch } : i));
    save.mutate(next);
  }

  function addIdea() {
    const title = draft.trim();
    if (!title) return;
    const next: MarketingIdea[] = [
      ...ideas,
      {
        id: `custom-${Date.now()}`,
        title,
        category: "content",
        effort: "medium",
        impact: "medium",
        status: "idea",
        notes: "",
        estimatedMonthlyLift: 200,
      },
    ];
    save.mutate(next);
    setDraft("");
  }

  const gap = metrics?.revenueToGoal ?? MONTHLY_SALES_GOAL;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-supply-600/30 bg-gradient-to-br from-supply-950/40 to-ink-900/80 p-6">
        <h2 className="font-display text-2xl text-supply-50">Path to {formatMoney(MONTHLY_SALES_GOAL)}/month</h2>
        <p className="mt-2 max-w-2xl text-sm text-supply-200/70">
          You need roughly <strong className="text-supply-100">{formatMoney(gap)}</strong> more this month.
          Active ideas below could add ~<strong className="text-supply-100">{formatMoney(projectedLift)}</strong> if
          executed — prioritize high impact, low effort first.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addIdea()}
          placeholder="Brainstorm a new campaign or offer…"
          className="flex-1 rounded-xl border border-white/10 bg-ink-900/80 px-4 py-3 text-sm text-supply-100 placeholder:text-supply-200/30 focus:border-supply-500/50 focus:outline-none focus:ring-1 focus:ring-supply-500/30"
        />
        <button
          type="button"
          onClick={addIdea}
          className="rounded-xl bg-supply-600 px-5 py-3 text-sm font-semibold text-white hover:bg-supply-500"
        >
          Add idea
        </button>
      </div>

      <ul className="space-y-4">
        {ideas.map((idea) => (
          <li key={idea.id} className="rounded-2xl bg-ink-900/60 p-5 ring-1 ring-white/5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-supply-50">{idea.title}</p>
                {idea.notes && <p className="mt-1 text-sm text-supply-200/60">{idea.notes}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <SelectChip
                    label="Status"
                    value={idea.status}
                    options={["idea", "planned", "in_progress", "done"]}
                    onChange={(v) => updateIdea(idea.id, { status: v as MarketingIdea["status"] })}
                  />
                  <SelectChip
                    label="Category"
                    value={idea.category}
                    options={categories}
                    onChange={(v) => updateIdea(idea.id, { category: v as MarketingIdea["category"] })}
                  />
                  <SelectChip
                    label="Impact"
                    value={idea.impact}
                    options={["low", "medium", "high"]}
                    onChange={(v) => updateIdea(idea.id, { impact: v as MarketingIdea["impact"] })}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-supply-300">
                  ~{formatMoney(idea.estimatedMonthlyLift ?? 0)}/mo
                </p>
                <p className="text-xs text-supply-200/40">est. lift</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SelectChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1 rounded-lg bg-ink-850 px-2 py-1 text-xs text-supply-200/70 ring-1 ring-white/5">
      <span className="text-supply-200/40">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-supply-100 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-ink-900">
            {o.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
