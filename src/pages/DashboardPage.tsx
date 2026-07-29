import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MONTHLY_SALES_GOAL } from "../../shared/types";
import { HealthCard } from "@/components/HealthCard";
import { RevenueChart } from "@/components/RevenueChart";
import { api } from "@/lib/api";
import { formatMoney, formatMoneyPrecise } from "@/lib/format";

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["metrics"],
    queryFn: api.getMetrics,
  });

  if (isLoading) {
    return <p className="text-supply-200/60">Loading store pulse…</p>;
  }
  if (error || !data) {
    return <p className="text-rose-300">Could not load metrics. {error?.message}</p>;
  }

  const pacePerDay =
    data.revenueToGoal > 0
      ? data.revenueToGoal /
        Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate())
      : 0;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Month to date" value={formatMoney(data.monthToDateRevenue, data.currency)} sub={`${data.monthToDateOrders} orders`} />
        <StatCard label="Avg order value" value={formatMoneyPrecise(data.averageOrderValue, data.currency)} sub="This month" />
        <StatCard
          label="$5k goal"
          value={`${Math.round(data.goalProgressPercent)}%`}
          sub={data.revenueToGoal > 0 ? `${formatMoney(data.revenueToGoal, data.currency)} to go` : "Goal hit 🎯"}
        />
        <StatCard
          label="Daily pace needed"
          value={data.revenueToGoal > 0 ? formatMoney(pacePerDay, data.currency) : "—"}
          sub="Rest of month"
        />
      </section>

      <section className="rounded-2xl bg-ink-900/60 p-6 ring-1 ring-white/5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl text-supply-50">Revenue trend</h2>
          <span className="text-xs text-supply-200/50">Last {data.dailyRevenue.length} days</span>
        </div>
        <RevenueChart data={data.dailyRevenue} currency={data.currency} />
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-850">
          <div
            className="h-full rounded-full bg-gradient-to-r from-supply-700 to-supply-400 transition-all"
            style={{ width: `${data.goalProgressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-supply-200/50">
          Progress toward {formatMoney(MONTHLY_SALES_GOAL, data.currency)}/month target
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-display text-xl text-supply-50">What needs you</h2>
          {data.health.map((h) => (
            <HealthCard key={h.id} signal={h} />
          ))}
          {data.pendingApprovals > 0 && (
            <Link
              to="/orders"
              className="inline-flex text-sm font-medium text-supply-300 underline-offset-4 hover:text-supply-100 hover:underline"
            >
              Review {data.pendingApprovals} order(s) →
            </Link>
          )}
        </div>

        <div className="rounded-2xl bg-ink-900/60 p-6 ring-1 ring-white/5">
          <h2 className="mb-4 font-display text-xl text-supply-50">Top products (MTD)</h2>
          <ul className="space-y-3">
            {data.topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3 border-b border-white/5 pb-3 last:border-0">
                <span className="font-mono text-xs text-supply-500">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-supply-100">{p.name}</p>
                  <p className="text-xs text-supply-200/50">{p.units} units</p>
                </div>
                <p className="font-mono text-sm text-supply-300">{formatMoney(p.revenue, data.currency)}</p>
              </li>
            ))}
          </ul>
          <Link
            to="/marketing"
            className="mt-4 inline-flex text-sm text-supply-400 hover:text-supply-200"
          >
            Open growth playbook →
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-ink-900/60 p-5 ring-1 ring-white/5">
      <p className="text-xs uppercase tracking-wider text-supply-200/50">{label}</p>
      <p className="mt-2 font-display text-2xl text-supply-50">{value}</p>
      <p className="mt-1 text-xs text-supply-200/50">{sub}</p>
    </div>
  );
}
